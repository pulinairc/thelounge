import {PluginInputHandler} from "./index";
import Msg from "../../models/msg";
import {MessageType} from "../../../shared/types/msg";
import {ChanType} from "../../../shared/types/chan";
import telemetry from "../../telemetry";

const commands = ["slap", "me"];

const input: PluginInputHandler = function ({irc}, chan, cmd, args) {
	if (chan.type !== ChanType.CHANNEL && chan.type !== ChanType.QUERY) {
		chan.pushMessage(
			this,
			new Msg({
				type: MessageType.ERROR,
				text: `${cmd} command can only be used in channels and queries.`,
			})
		);

		return;
	}

	let text;

	switch (cmd) {
		case "slap":
			text = "slaps " + args[0] + " around a bit with a large trout";
		/* fall through */
		case "me":
			if (args.length === 0) {
				break;
			}

			text = text || args.join(" ");

			telemetry.logEvent("message_sent", {
				clientId: this.id,
				ip: this.config.browser?.ip,
				hostname: this.config.browser?.hostname,
				networkUuid: chan.id ? undefined : undefined,
				kind: "action",
				command: cmd,
				nick: irc.user.nick,
				ident: irc.user.username,
				ircHostname: irc.user.host,
				target: chan.name,
				messageLength: text.length,
				message: telemetry.logsMessageContent ? text : undefined,
			});

			irc.action(chan.name, text);

			// If the IRCd does not support echo-message, simulate the message
			// being sent back to us.
			if (!irc.network.cap.isEnabled("echo-message")) {
				irc.emit("action", {
					nick: irc.user.nick,
					target: chan.name,
					message: text,
				});
			}

			break;
	}

	return true;
};

export default {
	commands,
	input,
};
