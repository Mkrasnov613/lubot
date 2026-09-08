import ytSearch from "yt-search";
import { validateTrackCandidate } from "../utils/validation.js";

let ioRef = null;
const stateByTenant = new Map();

export function roomName(tenantId) {
  return `tenant:${tenantId}`;
}

function ensureTenantState(tenantId) {
  if (!tenantId) throw new Error("Missing tenantId in player");
  if (!stateByTenant.has(tenantId)) {
    stateByTenant.set(tenantId, { QUEUE: [], nowPlaying: null });
  }
  return stateByTenant.get(tenantId);
}

export function initPlayer(io) {
  ioRef = io;
}

export function getState(tenantId) {
  return ensureTenantState(tenantId);
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

export function enqueue(tenantId, track) {
  const tenantState = ensureTenantState(tenantId);
  tenantState.QUEUE.push(track);
  if (ioRef) {
    ioRef.to(roomName(tenantId)).emit("queue:update", {
      queue: tenantState.QUEUE,
      nowPlaying: tenantState.nowPlaying,
    });
  }
}

export function playNext(tenantId) {
  const tenantState = ensureTenantState(tenantId);
  tenantState.nowPlaying = tenantState.QUEUE.shift() || null;
  if (ioRef) {
    ioRef.to(roomName(tenantId)).emit("player:play", {
      track: tenantState.nowPlaying,
    });
    ioRef.to(roomName(tenantId)).emit("queue:update", {
      queue: tenantState.QUEUE,
      nowPlaying: tenantState.nowPlaying,
    });
  }
  return tenantState.nowPlaying;
}

export function skip(tenantId) {
  return playNext(tenantId);
}
