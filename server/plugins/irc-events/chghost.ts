import {IrcEventHandler} from "../../client";

import Msg from "../../models/msg";
import {MessageType} from "../../../shared/types/msg";
import telemetry from "../../telemetry";

export default <IrcEventHandler>function (irc, network) {
	const client = this;

	// If server supports CHGHOST cap, then changing the hostname does not require
	// sending PART and JOIN, which means less work for us over all
	irc.on("user updated", function (data) {
		if (data.nick === irc.user.nick) {
			telemetry.logEvent("network_registered", {
				clientId: client.id,
				ip: client.config.browser?.ip,
				hostname: client.config.browser?.hostname,
				networkUuid: network.uuid,
				networkName: network.name,
				kind: "chghost",
				nick: data.nick,
				oldIdent: data.ident,
				newIdent: data.new_ident,
				oldHostname: data.hostname,
				newHostname: data.new_hostname,
			});
		}

		network.channels.forEach((chan) => {
			const user = chan.findUser(data.nick);

			if (typeof user === "undefined") {
				return;
			}

			const msg = new Msg({
				time: data.time,
				type: MessageType.CHGHOST,
				new_ident: data.ident !== data.new_ident ? data.new_ident : "",
				new_host: data.hostname !== data.new_hostname ? data.new_hostname : "",
				self: data.nick === irc.user.nick,
				from: user,
			});

			chan.pushMessage(client, msg);
		});
	});
};
