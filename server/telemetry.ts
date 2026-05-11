import fs from "fs";
import path from "path";
import Config from "./config";
import log from "./log";

type TelemetryEvent =
	| "connect"
	| "disconnect"
	| "network_connect"
	| "network_disconnect"
	| "channel_join"
	| "message_sent";

type TelemetryData = Record<string, any>;

let stream: fs.WriteStream | null = null;
let enabled = false;
let logMessageContent = false;

function init() {
	const conf = Config.values.telemetry;

	if (!conf || conf.enabled !== true) {
		return;
	}

	enabled = true;
	logMessageContent = conf.logMessageContent === true;

	const filePath = conf.path
		? path.resolve(Config.getHomePath(), conf.path)
		: path.join(Config.getHomePath(), "telemetry.log");

	try {
		stream = fs.createWriteStream(filePath, {flags: "a"});
		stream.on("error", (err) => {
			log.error(`Telemetry write stream error: ${err.message}`);
			enabled = false;
		});
		log.info(`Telemetry enabled, writing to ${filePath}`);
	} catch (err: any) {
		log.error(`Failed to open telemetry log: ${err.message as string}`);
		enabled = false;
	}
}

function logEvent(event: TelemetryEvent, data: TelemetryData) {
	if (!enabled || !stream) {
		return;
	}

	const entry = {
		ts: new Date().toISOString(),
		event,
		...data,
	};

	stream.write(JSON.stringify(entry) + "\n");
}

export default {
	init,
	logEvent,
	get isEnabled() {
		return enabled;
	},
	get logsMessageContent() {
		return logMessageContent;
	},
};
