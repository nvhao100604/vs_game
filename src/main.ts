import { AUTO, Game, Scale } from "phaser";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";

new Game({
    type: AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [MenuScene, GameScene],
})