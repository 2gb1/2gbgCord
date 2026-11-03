/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
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

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { FormSwitch } from "@components/FormSwitch";
import { FolderIcon, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "@components/Icons";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import NoTrack from "@plugins/_core/noTrack";
import SettingsPlugin from "@plugins/_core/settings";
import { IS_WINDOWS } from "@utils/constants";
import { Margins } from "@utils/margins";
import { relaunch } from "@utils/native";
import { promptToRestart } from "@utils/promptToRestart";
import { Forms, React } from "@webpack/common";

import { MacOSVibrancySettings } from "./MacVibrancySettings";
import { NotificationSection } from "./NotificationSettings";
import { WindowsMaterialSettings } from "./WindowsMaterialSettings";

const SERVER_INVITE = "https://discord.gg/C3C7av8S9E";
const BANNER_GIF = "https://i.pinimg.com/originals/22/c1/d7/22c1d7be4f7985fedc437fe58a578ceb.gif";

// ستايل البطاقات السوداء الموحد لأقسام الصفحة
const darkCardStyle: React.CSSProperties = {
    background: "#050505",
    backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.14) 1px, transparent 0)",
    backgroundSize: "24px 24px",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "16px",
    boxShadow: "0 8px 28px rgba(0, 0, 0, 0.75)"
};

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

// البانر الأسود الفخم مع النجوم البيضاء وتأثير الكتابة التلقائية
function CustomSupportBanner() {
    const fullText = "Welcome to 2gv5cord! If you want to support us or stay updated, join our Discord server.";
    const [typedText, setTypedText] = React.useState("");

    React.useEffect(() => {
        let index = 0;
        setTypedText("");
        const timer = setInterval(() => {
            if (index < fullText.length) {
                setTypedText(prev => prev + fullText.charAt(index));
                index++;
            } else {
                clearInterval(timer);
            }
        }, 40);

        return () => clearInterval(timer);
    }, []);

    return (
        <div
            style={{
                background: "#000000",
                backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 0)",
                backgroundSize: "22px 22px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "14px",
                padding: "22px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 10px 35px rgba(0, 0, 0, 0.95)",
                marginBottom: "20px"
            }}
        >
            <div style={{ zIndex: 2, maxWidth: "75%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{
                        color: "#ffffff",
                        fontSize: "19px",
                        fontWeight: 700,
                        letterSpacing: "0.3px"
                    }}>
                        Support the Project
                    </span>
                    <span style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        border: "1px solid rgba(255, 255, 255, 0.25)"
                    }}>
                        2gv5cord
                    </span>
                </div>

                <p style={{
                    color: "#d1d1d6",
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    minHeight: "22px",
                    fontFamily: "monospace"
                }}>
                    {typedText}
                    <span style={{ opacity: 0.75 }}>|</span>
                </p>

                <button
                    onClick={() => VencordNative.native.openExternal(SERVER_INVITE)}
                    style={{
                        background: "#ffffff",
                        color: "#000000",
                        padding: "8px 18px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: 700,
                        fontSize: "13px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 4px 15px rgba(255, 255, 255, 0.25)",
                        cursor: "pointer"
                    }}
                >
                    Join Server
                </button>
            </div>

            <div style={{ zIndex: 2 }}>
                <img
                    src={BANNER_GIF}
                    alt="2gv5cord"
                    style={{
                        width: "76px",
                        height: "76px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid rgba(255, 255, 255, 0.35)",
                        boxShadow: "0 0 20px rgba(255, 255, 255, 0.15)"
                    }}
                />
            </div>
        </div>
    );
}

function Switches() {
    const settings = useSettings(["useQuickCss", "enableReactDevtools", "frameless", "nativeTitleBar", "transparent", "winCtrlQ", "disableMinSize"]);
    const { disableAnalytics } = NoTrack.settings.use(["disableAnalytics"]);

    const Switches = [
        {
            key: "useQuickCss",
            title: "Enable Custom CSS",
            description: "Apply your configured QuickCSS"
        },
        {
            value: disableAnalytics,
            updateSetting(newValue) {
                NoTrack.settings.store.disableAnalytics = newValue;
            },
            reactKey: "NoTrack::disableAnalytics",
            key: null!,
            title: "Block Discord Analytics",
            description: NoTrack.settings.def.disableAnalytics.description,
            restartRequired: NoTrack.settings.def.disableAnalytics.restartNeeded,
        },
        IS_DISCORD_DESKTOP && {
            key: "nativeTitleBar",
            title: "Enable the system's title bar in addition to Discord's custom one",
            restartRequired: true
        },
        !IS_WEB && {
            key: "transparent",
            title: "Enable window transparency",
            description: "A theme that supports transparency is required or this will do nothing. Stops the window from being resizable as a side effect",
            restartRequired: true
        },
        IS_DISCORD_DESKTOP && {
            key: "disableMinSize",
            title: "Disable minimum window size",
            description: "Allows you to resize the window to any size, even smaller than Discord's minimum size",
            restartRequired: true
        },
        !IS_WEB && IS_WINDOWS && {
            key: "winCtrlQ",
            title: "Register Ctrl+Q as shortcut to close Discord (Alternative to Alt+F4)",
            restartRequired: true
        },
        !IS_WEB && {
            key: "enableReactDevtools",
            title: "Enable React Developer Tools",
            description: "Mainly useful for plugin developers. Ignore this if you don't know what it is",
            restartRequired: true
        },
    ] satisfies Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        reactKey?: string;
        title: string;
        description?: string;
        restartRequired?: boolean;
        updateSetting?(newValue: boolean): void;
        value?: boolean;
    }>;

    return Switches.map(setting => {
        if (!setting) {
            return null;
        }

        const { reactKey, key, value, title, description, restartRequired, updateSetting = v => (settings[key] = v) } = setting;

        return (
            <FormSwitch
                key={reactKey ?? key}
                title={title}
                description={description}
                value={value ?? settings[key]}
                hideBorder
                onChange={v => {
                    updateSetting(v);

                    if (restartRequired) {
                        promptToRestart("relaunch");
                    }
                }}
            />
        );
    });
}

function VencordSettings() {
    return (
        <SettingsTab>
            {/* ستايل إضافي لتحويل الأزرار الداخلية في الصفحة للثيم الأسود والأبيض */}
            <style>{`
                .vc-2gv5-dark-wrapper button[class*="lookFilled"] {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    font-weight: 700 !important;
                    border-radius: 8px !important;
                    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15) !important;
                }
                .vc-2gv5-dark-wrapper button[class*="lookFilled"]:hover {
                    background-color: #e4e4e7 !important;
                }
            `}</style>

            <div className="vc-2gv5-dark-wrapper">
                {/* البانر الأسود الفخم */}
                <CustomSupportBanner />

                {/* قسم الإجراءات السريعة */}
                <section style={darkCardStyle}>
                    <Forms.FormTitle tag="h5" style={{ color: "#ffffff", marginBottom: "12px" }}>
                        Quick Actions
                    </Forms.FormTitle>

                    <QuickActionCard>
                        <QuickAction
                            Icon={LogIcon}
                            text="Notification Log"
                            action={openNotificationLogModal}
                        />
                        <QuickAction
                            Icon={PaintbrushIcon}
                            text="Edit QuickCSS"
                            action={() => VencordNative.quickCss.openEditor()}
                        />
                        {!IS_WEB && (
                            <>
                                <QuickAction
                                    Icon={RestartIcon}
                                    text="Relaunch Discord"
                                    action={relaunch}
                                />
                                <QuickAction
                                    Icon={FolderIcon}
                                    text="Open Settings Folder"
                                    action={() => VencordNative.settings.openFolder()}
                                />
                            </>
                        )}
                        <QuickAction
                            Icon={GithubIcon}
                            text="Join 2gv5cord Server"
                            action={() => VencordNative.native.openExternal(SERVER_INVITE)}
                        />
                    </QuickActionCard>
                </section>

                {/* قسم الإعدادات والمفاتيح */}
                <section style={darkCardStyle}>
                    <Forms.FormTitle tag="h5" style={{ color: "#ffffff" }}>
                        2gv5cord Settings
                    </Forms.FormTitle>
                    <Forms.FormText className={Margins.bottom20} style={{ color: "#a1a1aa" }}>
                        Hint: You can change the position of this settings section in the{" "}
                        <a
                            style={{ color: "#ffffff", textDecoration: "underline", cursor: "pointer" }}
                            onClick={() => openPluginModal(SettingsPlugin)}
                        >
                            settings of the Settings plugin
                        </a>!
                    </Forms.FormText>

                    <div className="vc-settings-switches">
                        <Switches />
                    </div>
                </section>

                {/* قسم المظهر والإشعارات */}
                <section style={darkCardStyle}>
                    <MacOSVibrancySettings />
                    <WindowsMaterialSettings />
                    <NotificationSection />
                </section>
            </div>
        </SettingsTab>
    );
}

export default wrapTab(VencordSettings, "2gv5cord Settings");