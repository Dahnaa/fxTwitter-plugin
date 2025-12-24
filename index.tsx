/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { showNotification } from "@api/Notifications";
import { MessageObject } from "@api/MessageEvents";
import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { IconComponent, OptionType } from "@utils/types";

type FXMode = "none" | "domain" | "gallery" | "text";

const MODES: FXMode[] = ["none", "domain", "gallery", "text"];
const MODE_PREFIX: Record<FXMode, string> = { none: "", domain: "d.", gallery: "g.", text: "t." };
const VERSION = "1.0.0";
const UPDATE_URL = "https://github.com/Dahnaa/fxTwitter-plugin";

let notified = false;

const settings = definePluginSettings({
    showIcon: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Shows a toggleable icon on the right side of the chat bar.",
    },
    mode: {
        type: OptionType.SELECT,
        description: "Mode used for the FXTwitter links: None, Domain, Gallery, Text.",
        options: MODES.map(m => ({
            label: m.charAt(0).toUpperCase() + m.slice(1),
            value: m,
            default: m === "none"
        })),
    },
    version: {
        type: OptionType.STRING,
        default: VERSION,
        description: "Installed plugin version",
        disabled: true
    }
});


const FXIcon: IconComponent = ({ height = 20, width = 20, className }) => {
    const { mode } = settings.use(["mode"]);
    const letter = mode === "none" ? "FX" : mode[0].toUpperCase();

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            className={className}
            fill="currentColor"
        >
            <text
                x="12"
                y="13"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="20"
                fontWeight="700"
                fontFamily="Arial, Helvetica, sans-serif"
            >
                {letter}
            </text>
        </svg>
    );
};

const FXButton: ChatBarButtonFactory = ({ isMainChat }) => {
    const { mode, showIcon } = settings.use(["mode", "showIcon"]);

    if (!isMainChat || !showIcon) return null;

    return (
        <ChatBarButton
            tooltip={`${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
            onClick={() => {
                const nextIndex =
                    (MODES.indexOf(mode as FXMode) + 1) % MODES.length;
                settings.store.mode = MODES[nextIndex];
            }}
        >
            <FXIcon />
        </ChatBarButton>
    );
};

const TWITTER_REGEX = /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/\S+/gi;

function cleanMessage(msg: MessageObject) {
    if (!msg.content?.includes("http")) return;

    const prefix = MODE_PREFIX[settings.store.mode as FXMode];
    msg.content = msg.content.replace(TWITTER_REGEX, m => 
        m.replace(/https?:\/\/(?:www\.)?(?:twitter|x)\.com/, `https://${prefix}fxtwitter.com`)
    );
}

export default definePlugin({
    name: "FXTwitter",
    description: "Automatically rewrites Twitter/X links into FXTwitter links with toggleable modes.",
    authors: [{ name: "@dahnaa, Dona", id: 821451701331820615n }],
    settings,

    start() {
        if (notified) return;
        notified = true;

        showNotification({
            title: "FXTwitter",
            body: "Click to open the GitHub repository for updates.",
            color: "#1da1f2",
            onClick: () => window.open(UPDATE_URL)
        });
    },

    chatBarButton: {
        icon: FXIcon,
        render: FXButton
    },

    onBeforeMessageSend: (_, msg) => cleanMessage(msg),
    onBeforeMessageEdit: (_, __, msg) => cleanMessage(msg)
});
