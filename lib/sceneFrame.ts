import { createSceneState } from "./sceneKeyframes";

/**
 * The scene pose evaluated once per frame by SceneDirector (which runs before
 * every other useFrame). Everything else in the canvas reads from here so the
 * keyframe track is only interpolated once per frame.
 */
export const liveScene = createSceneState();
