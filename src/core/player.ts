import { GRAVITY, GROUND_Y, JUMP_VELOCITY, PLAYER_SIZE, PLAYER_SPEED, WORLD_WIDTH } from "./config"
import { clamp } from "./math"


export type PlayerState = {
    x: number,
    y: number,
    vy: number,
    on_ground: boolean
}

export type PlayerInput = {
    left: boolean,
    right: boolean,
    up: boolean
}

export const CreatePlayer = (x: number): PlayerState => {
    return {
        x,
        y: GROUND_Y,
        vy: 0,
        on_ground: true
    }
}

export const UpdatePlayer = (ps: PlayerState, input: PlayerInput, prev: PlayerInput): PlayerState => {
    let { x, y, vy, on_ground } = ps;

    if (input.left) x -= PLAYER_SPEED;
    if (input.right) x += PLAYER_SPEED;
    x = clamp(x, PLAYER_SIZE / 2, WORLD_WIDTH - PLAYER_SIZE / 2);

    const jump_pressed = input.up && !prev.up;

    if (jump_pressed && ps.on_ground) {
        vy = JUMP_VELOCITY;
        on_ground = false;
    }

    vy += GRAVITY;
    y += vy;

    if (y >= GROUND_Y) {
        y = GROUND_Y;
        vy = 0;
        on_ground = true;
    }

    return { x, y, vy, on_ground }
} 