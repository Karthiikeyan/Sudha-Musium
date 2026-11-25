// Room registry: the ordered list of rooms, built at runtime from the photo plan.
import { content } from '../config/content'
import { starHints } from '../config/journey'
import {
  cinemaLayout,
  hallLayout,
  lobbyLayout,
  loungeLayout,
  postOfficeLayout,
  rooftopLayout,
  type RoomLayout,
} from '../scene/layout'
import type { HallPlan, JourneyPlan } from './plan'

export type RoomKind = 'lobby' | 'hall' | 'cinema' | 'lounge' | 'post-office' | 'rooftop'

export interface Palette {
  bg: string
  floor: string
  wall: string
  trim: string
  accent: string
  fog: [string, number, number] | null
}

export interface CameraPreset {
  height: number
  back: number
  lookAhead: number
  fov: number
  damping: number
}

export interface RoomDef {
  id: string
  kind: RoomKind
  order: number
  /** short name for the map */
  name: string
  /** chapter card: "Chapter 2" · title — subtitle */
  chapterLabel: string
  title: string
  subtitle: string
  palette: Palette
  camera: CameraPreset
  layout: RoomLayout
  hall?: HallPlan
  starHint: string
}

const PALETTES: Record<RoomKind, Palette> = {
  lobby: { bg: '#121216', floor: '#3a3530', wall: '#2a2a30', trim: '#c9a45c', accent: '#e8c27a', fog: null },
  hall: { bg: '#1a1a20', floor: '#f1eee8', wall: '#f3f0ea', trim: '#e4dfd6', accent: '#f7c6d4', fog: null },
  cinema: { bg: '#0d0b10', floor: '#2a1a22', wall: '#2b1820', trim: '#8f2d45', accent: '#ff8fab', fog: null },
  lounge: { bg: '#1c1714', floor: '#d9b98f', wall: '#fbeed0', trim: '#f2c7a8', accent: '#f7c6d4', fog: null },
  'post-office': { bg: '#17110c', floor: '#8a6440', wall: '#b58658', trim: '#5e3d22', accent: '#f0b45a', fog: null },
  rooftop: { bg: '#0b1230', floor: '#3b4058', wall: '#565c78', trim: '#8a90ad', accent: '#ffd58a', fog: ['#0b1230', 30, 90] },
}

const CAMERAS: Record<RoomKind, CameraPreset> = {
  lobby: { height: 6.4, back: 7.8, lookAhead: 2.2, fov: 45, damping: 5 },
  hall: { height: 5.8, back: 7.4, lookAhead: 2.6, fov: 45, damping: 5 },
  cinema: { height: 7.4, back: 8.4, lookAhead: 2.4, fov: 45, damping: 5 },
  lounge: { height: 6.4, back: 7.8, lookAhead: 2.2, fov: 45, damping: 5 },
  'post-office': { height: 6.0, back: 7.4, lookAhead: 2.2, fov: 45, damping: 5 },
  rooftop: { height: 7.0, back: 9.0, lookAhead: 2.4, fov: 46, damping: 4.5 },
}

export function buildRooms(plan: JourneyPlan): RoomDef[] {
  const rooms: Omit<RoomDef, 'order' | 'chapterLabel'>[] = []
  const names = content.roomNames
  rooms.push({
    id: 'lobby',
    kind: 'lobby',
    name: 'Ticket Gate',
    title: names.lobby,
    subtitle: 'your ticket, please 🎟️',
    palette: PALETTES.lobby,
    camera: CAMERAS.lobby,
    layout: lobbyLayout(),
    starHint: starHints.lobby,
  })
  plan.halls.forEach((h) => {
    rooms.push({
      id: h.id,
      kind: 'hall',
      name: `Memory Lane ${h.no}`,
      title: `${names.hall} — ${h.title}`,
      subtitle: h.subtitle,
      palette: PALETTES.hall,
      camera: CAMERAS.hall,
      layout: hallLayout(h.photos, h.no),
      hall: h,
      starHint: starHints[h.id] ?? starHints['hall-1'],
    })
  })
  rooms.push(
    {
      id: 'cinema',
      kind: 'cinema',
      name: 'Cinema',
      title: names.cinema,
      subtitle: 'now showing: the two of us, being ridiculous',
      palette: PALETTES.cinema,
      camera: CAMERAS.cinema,
      layout: cinemaLayout(),
      starHint: starHints.cinema,
    },
    {
      id: 'lounge',
      kind: 'lounge',
      name: 'Lounge',
      title: names.lounge,
      subtitle: 'cosy chairs and serious questions',
      palette: PALETTES.lounge,
      camera: CAMERAS.lounge,
      layout: loungeLayout(),
      starHint: starHints.lounge,
    },
    {
      id: 'post-office',
      kind: 'post-office',
      name: 'Post Office',
      title: names['post-office'],
      subtitle: 'you have mail 💌',
      palette: PALETTES['post-office'],
      camera: CAMERAS['post-office'],
      layout: postOfficeLayout(),
      starHint: starHints['post-office'],
    },
    {
      id: 'rooftop',
      kind: 'rooftop',
      name: 'Rooftop',
      title: names.rooftop,
      subtitle: 'the best view is saved for last',
      palette: PALETTES.rooftop,
      camera: CAMERAS.rooftop,
      layout: rooftopLayout(),
      starHint: '',
    },
  )
  return rooms.map((r, i) => ({ ...r, order: i, chapterLabel: `Chapter ${i + 1}` }))
}
