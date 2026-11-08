export const TICK_MS = 1000 / 60;
export class FixedTimeStep {
    private saved = 0;

    advance(deltaMs: number, step: () => void) {
        this.saved += deltaMs;

        while (this.saved >= TICK_MS) {
            step();
            this.saved -= TICK_MS;
        }
    }
}