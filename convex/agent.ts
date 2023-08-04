// 'use node';
// ^ This tells Convex to run this in a `node` environment.
// Read more: https://docs.convex.dev/functions/runtimes
import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';

import { ActionCtx, internalAction } from './_generated/server';
import { MemoryDB } from './lib/memory';
import { Message } from './lib/openai';
import { Snapshot, Action, Position, Worlds } from './types';
import { converse, startConversation, walkAway } from './conversation';

// 1. The engine kicks off this action.
export const runAgent = internalAction({
  args: { snapshot: Snapshot, noSchedule: v.optional(v.boolean()), world: Worlds.doc },
  handler: async (ctx, { snapshot, noSchedule, world }) => {
    const memory = MemoryDB(ctx);
    const actionAPI = ActionAPI(ctx, snapshot.player.id, noSchedule ?? false);
    try {
      // 2. We run the agent loop
      await agentLoop(snapshot, memory, actionAPI, world);
    } finally {
      // should only be called from here, to match the "thinking" entry.
      // 3. We mark the agent as done
      await actionAPI({ type: 'done' });
    }
  },
});

export function ActionAPI(ctx: ActionCtx, playerId: Id<'players'>, noSchedule: boolean) {
  return (action: Action) => {
    return ctx.runMutation(internal.engine.handleAgentAction, {
      playerId,
      action,
      noSchedule,
    });
  };
}
export type ActionAPI = ReturnType<typeof ActionAPI>;

export async function agentLoop(
  { player, nearbyPlayers, nearbyConversations, lastPlan }: Snapshot,
  memory: MemoryDB,
  actionAPI: ActionAPI,
  world: Doc<'worlds'>,
) {
  const imWalkingHere = player.motion.type === 'walking';
  const newFriends = nearbyPlayers.filter((a) => a.new).map(({ player }) => player);
  const othersThinking = newFriends.find((a) => a.thinking);
  const nearbyPlayerIds = nearbyPlayers.map(({ player }) => player.id);
  // Handle new observations
  //   Calculate scores
  //   If there's enough observation score, trigger reflection?
  // Wait for new memories before proceeding
  // Future: Store observations about seeing players?
  //  might include new observations -> add to memory with openai embeddings
  // Based on plan and observations, determine next action:
  //   if so, add new memory for new plan, and return new action

  // Check if any messages are from players still nearby.
  let relevantConversations = nearbyConversations.filter(
    (c) => c.messages.filter((m) => nearbyPlayerIds.includes(m.from)).length,
  );
  const lastConversation = relevantConversations.find(
    (c) => c.conversationId === player.lastSpokeConversationId,
  );
  if (lastConversation) {
    relevantConversations = [lastConversation];
  } else {
    if (player.lastSpokeConversationId) {
      // If we aren't part of a conversation anymore, remember it.
      await memory.rememberConversation(
        player.id,
        player.lastSpokeConversationId,
        player.lastSpokeTs,
      );
    }
  }

  for (const { conversationId, messages } of relevantConversations) {
    const chatHistory: Message[] = [
      ...messages.map((m) => ({
        role: 'user' as const,
        content: `${m.fromName} to ${m.toNames.join(',')}: ${m.content}\n`,
      })),
    ];
    const shouldWalkAway = await walkAway(chatHistory, player);
    console.log('shouldWalkAway: ', shouldWalkAway);

    // Decide if we keep talking.
    if (shouldWalkAway || messages.length >= 10) {
      // It's to chatty here, let's go somewhere else.
      if (!imWalkingHere) {
        if (await actionAPI({ type: 'travel', position: getRandomPosition(world) })) {
          return;
        }
      }
      break;
    } else if (messages.at(-1)?.from !== player.id) {
      // Let's stop and be social
      if (imWalkingHere) {
        await actionAPI({ type: 'stop' });
      }

      const playerCompletion = await converse(chatHistory, player, nearbyPlayers, memory);
      // display the chat via actionAPI
      await actionAPI({
        type: 'saySomething',
        audience: nearbyPlayers.map(({ player }) => player.id),
        content: playerCompletion,
        conversationId: conversationId,
      });
      // Now that we're remembering the conversation overall,
      // don't store every message. We'll have the messages history for that.
      // await memory.addMemories([
      //   {
      //     playerId: player.id,
      //     description: playerCompletion,
      //     ts: Date.now(),
      //     data: {
      //       type: 'conversation',
      //       conversationId: conversationId,
      //     },
      //   },
      // ]);

      // Only message in one conversation
      return;
    }
  }
  // We didn't say anything in a conversation yet.
  if (newFriends.length) {
    // Let's stop and be social
    if (imWalkingHere) {
      await actionAPI({ type: 'stop' });
    }
    // Hey, new friends
    if (!othersThinking) {
      // Decide whether we want to talk
      const newFriendsNames = newFriends.map((a) => a.name);
      const playerCompletion = await startConversation(newFriendsNames, memory, player);

      if (
        await actionAPI({
          type: 'startConversation',
          audience: newFriends.map((a) => a.id),
          content: playerCompletion,
        })
      ) {
        return;
      }
    }
  }
  if (!imWalkingHere) {
    // TODO: make a better plan
    const success = await actionAPI({ type: 'travel', position: getRandomPosition(world) });
    if (success) {
      return;
    }
  }
  // Otherwise I guess just keep walking?
  // TODO: consider reflecting on recent memories
}

export function getRandomPosition(world: Doc<'worlds'>): Position {
  return {
    x: Math.floor(Math.random() * world.width),
    y: Math.floor(Math.random() * world.height),
  };
}

// For making conversations happen without walking around.
export const runConversation = internalAction({
  args: { numPlayers: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    // To always clear all first:
    await ctx.runAction(internal.init.resetFrozen);
    // To always make a new world:
    // await ctx.runAction(internal.init.seed, { newWorld: true });
    // To just run with the existing agents:
    //await ctx.runAction(internal.init.seed, {});

    // Grabs the latest world
    const { playerIds, world } = await ctx.runQuery(internal.testing.getDebugPlayerIds);
    const memory = MemoryDB(ctx);
    let done = false;

    let firstTime = true;
    let ourConversationId: Id<'conversations'> | null = null;
    while (!done) {
      for (const playerId of playerIds) {
        const actionAPI = ActionAPI(ctx, playerId, true);
        const snapshot = await ctx.runMutation(internal.testing.debugAgentSnapshot, {
          playerId,
        });
        const { player, nearbyPlayers, nearbyConversations } = snapshot;
        if (nearbyPlayers.find(({ player }) => player.thinking)) {
          throw new Error('Unexpected thinking player ' + playerId);
        }
        const newFriends = nearbyPlayers.filter((a) => a.new).map(({ player }) => player);
        if (firstTime) {
          firstTime = false;
          if (nearbyConversations.length) {
            throw new Error('Unexpected conversations taking place');
          }
          const newFriendsNames = newFriends.map((a) => a.name);
          const playerCompletion = await startConversation(newFriendsNames, memory, player);
          if (
            !(await actionAPI({
              type: 'startConversation',
              audience: newFriends.map((a) => a.id),
              content: playerCompletion,
            }))
          )
            throw new Error('Unexpected failure to start conversation');
        } else {
          if (nearbyConversations.length !== 1) {
            throw new Error('Unexpected conversations taking place');
          }
          const { conversationId, messages } = nearbyConversations[0];
          if (!ourConversationId) {
            ourConversationId = conversationId;
          } else {
            if (conversationId !== ourConversationId) {
              throw new Error(
                'Unexpected conversationId ' + conversationId + ' != ' + ourConversationId,
              );
            }
          }
          const chatHistory: Message[] = [
            ...messages.map((m) => ({
              role: 'user' as const,
              content: `${m.fromName} to ${m.toNames.join(',')}: ${m.content}\n`,
            })),
          ];
          const shouldWalkAway = await walkAway(chatHistory, player);
          if (shouldWalkAway) {
            done = true;
            break;
          }
          const playerCompletion = await converse(chatHistory, player, nearbyPlayers, memory);
          // display the chat via actionAPI
          await actionAPI({
            type: 'saySomething',
            audience: nearbyPlayers.map(({ player }) => player.id),
            content: playerCompletion,
            conversationId: conversationId,
          });
        }
      }
    }
    if (!ourConversationId) throw new Error('No conversationId');
    for (const playerId of playerIds) {
      await memory.rememberConversation(playerId, ourConversationId, Date.now());
    }
  },
});
