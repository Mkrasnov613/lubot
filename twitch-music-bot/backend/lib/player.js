import ytSearch from "yt-search";
import { validateTrackCandidate } from "./validation.js";

let ioRef = null;
let QUEUE = [];
let nowPlaying = null;

export function initPlayer(io) {
  ioRef = io;
}

export function getState() {
  return { QUEUE, nowPlaying };
}

export async function resolveTrack(query, requester) {
  const res = await ytSearch(query);
  const v = res?.videos?.find(
    (x) => x.videoId && x.seconds > 0 && !x.live && !x.isLive && !x.isShorts
  );

  const cand = { title: v?.title, url: v?.url };
  const chk = validateTrackCandidate(cand);
  if (!chk.ok) throw new Error(chk.reason);

  return {
    id: v.videoId,
    videoId: v.videoId,
    title: v?.title,
    url: cand.url,
    author: v.author,
    thumb: v.thumbnail,
    requester,
    durationSec: v.seconds || 0,
  };
}

export function enqueue(track) {
  QUEUE.push(track);
  if (ioRef) ioRef.emit("queue:update", { queue: QUEUE, nowPlaying });
}

export function playNext() {
  nowPlaying = QUEUE.shift() || null;
  if (ioRef) {
    ioRef.emit("player:play", { track: nowPlaying });
    ioRef.emit("queue:update", { queue: QUEUE, nowPlaying });
  }
  return nowPlaying;
}

export function skip() {
  return playNext();
}
