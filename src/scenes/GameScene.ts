import { GameObjects, Input, Scene } from "phaser";
import { CreatePlayer, PlayerInput, PlayerState, UpdatePlayer } from "../core/player";
import { GROUND_Y, PLAYER_SIZE } from "../core/config";

type Keys = Record<'W' | 'A' | 'D' | 'ESC', Input.Keyboard.Key>;

export class GameScene extends Scene {
    private g!: GameObjects.Graphics;
    private keys!: Keys;
    private player!: PlayerState;

    constructor() {
        super('Game');
    }

    create() {
        this.g = this.add.graphics();
        this.keys = this.input.keyboard!.addKeys('W,A,D,ESC') as Keys;
        this.player = CreatePlayer(this.scale.width / 2);
    }

    update() {
        if (Input.Keyboard.JustDown(this.keys.ESC)) {
            this.scene.start('Menu');
            return;
        }

        const input = this.readInput();
        this.player = UpdatePlayer(this.player, input);
        this.draw();
    }

    private readInput = (): PlayerInput => {
        return {
            left: this.keys.A.isDown,
            right: this.keys.D.isDown,
            jump_pressed: Input.Keyboard.JustDown(this.keys.W)
        }
    }

    private draw = () => {
        const g = this.g;
        const p = this.player;
        g.clear();

        // Vẽ đất
        g.fillStyle(0x3a3a5a);
        g.fillRect(0, GROUND_Y, this.scale.width, this.scale.height - GROUND_Y);

        g.fillStyle(0xff5533);
        g.fillRect(p.x - PLAYER_SIZE / 2, p.y - PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);
    }
}
