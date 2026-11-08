import { Scene } from "phaser";

export class MenuScene extends Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const { height, width } = this.scale;

        this.add
            .text(
                width / 2,
                height / 2 - 60,
                'VS Game',
                {
                    fontSize: '64px',
                    color: '#ffffff',
                    fontStyle: 'bold',
                }
            )
            .setOrigin(0.5);

        this.add
            .text(
                width / 2,
                height / 2 + 40,
                "Press Enter to start game",
                {
                    fontSize: '24px',
                    color: '#aaaaaa'
                }
            )
            .setOrigin(0.5);

        this.input.keyboard!.once('keydown-ENTER', () => {
            this.scene.start('Game')
        })
    }
}