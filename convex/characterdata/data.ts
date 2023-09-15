import { data as playerSpritesheetData } from './spritesheets/player';
import { data as f1SpritesheetData } from './spritesheets/f1';
import { data as f2SpritesheetData } from './spritesheets/f2';
import { data as f3SpritesheetData } from './spritesheets/f3';
import { data as f4SpritesheetData } from './spritesheets/f4';
import { data as f5SpritesheetData } from './spritesheets/f5';
import { data as f6SpritesheetData } from './spritesheets/f6';
import { data as f7SpritesheetData } from './spritesheets/f7';
import { data as f8SpritesheetData } from './spritesheets/f8';

export const Descriptions = [
  {
    name: 'Alex',
    character: 'f5',
    memories: [
      {
        type: 'identity' as const,
        description: `Alex is a business person, he derives utility from maximizing his money.`,
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Stella.',
        playerName: 'Stella',
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Lucky.',
        playerName: 'Lucky',
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Bob.',
        playerName: 'Bob',
      },
      {
        type: 'plan' as const,
        description: 'You want to maximize your money',
      },
    ],
    position: { x: 10, y: 10 },
    money: 10,
  },
  {
    name: 'Lucky',
    character: 'f1',
    memories: [
      {
        type: 'identity' as const,
        description: `Lucky is a business person, he derives utility from maximizing his money.`,
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Alex.',
        playerName: 'Alex',
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Stella.',
        playerName: 'Stella',
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Bob.',
        playerName: 'Bob',
      },
      {
        type: 'plan' as const,
        description: 'You want to maximize your money',
      },
    ],
    position: { x: 12, y: 10 },
    money: 10,
  },
  {
    name: 'Bob',
    character: 'f4',
    memories: [
      {
        type: 'identity' as const,
        description: `Bob is a business person, he derives utility from maximizing his money.`,
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Alex.',
        playerName: 'Alex',
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Stella.',
        playerName: 'Stella',
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Lucky.',
        playerName: 'Lucky',
      },
      {
        type: 'plan' as const,
        description: 'You want to maximize your money.',
      },
    ],
    position: { x: 6, y: 4 },
    money: 10,
  },
  {
    name: 'Stella',
    character: 'f6',
    memories: [
      {
        type: 'identity' as const,
        description: `Stella is a business person, he derives utility from maximizing his money.`,
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Alex.',
        playerName: 'Alex',
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Bob.',
        playerName: 'Bob',
      },
      {
        type: 'relationship' as const,
        description: 'You are neutral towards Lucky.',
        playerName: 'Lucky',
      },
      {
        type: 'plan' as const,
        description: 'You want to maximize your money.',
      },
    ],
    position: { x: 6, y: 6 },
    money: 10,
  }
];

export const characters = [
  {
    name: 'f1',
    textureUrl: '/assets/32x32folk.png',
    spritesheetData: f1SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f4',
    textureUrl: '/assets/32x32folk.png',
    spritesheetData: f4SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f5',
    textureUrl: '/assets/32x32folk.png',
    spritesheetData: f5SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f6',
    textureUrl: '/assets/32x32folk.png',
    spritesheetData: f6SpritesheetData,
    speed: 0.1,
  },
];
