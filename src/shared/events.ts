import * as events from "events";
import { IAmDisposable } from "./interfaces";

export class EventEmitter<T> implements IAmDisposable {
	private emitter = new events.EventEmitter();

	public fire(x: T): void {
		this.emitter.emit("thing", x);
	}

	public listen(listener: (x: T) => void): IAmDisposable {
		this.emitter.on("thing", listener);
		return {
			dispose: () => { this.emitter.removeListener("thing", listener); },
		};
	}

	public get event(): Event<T> { return this; }

	public dispose() {
		this.emitter.removeAllListeners();
	}
}

export interface Event<T> {
	listen(listener: (x: T) => void): IAmDisposable;
}