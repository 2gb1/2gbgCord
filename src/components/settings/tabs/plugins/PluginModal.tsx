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

import "./PluginModal.css";

import { generateId } from "@api/Commands";
import { hasAnyVisibleSettings, isSettingHidden } from "@api/PluginManager";
import { useSettings } from "@api/Settings";
import { BaseText } from "@components/BaseText";
import ErrorBoundary from "@components/ErrorBoundary";
import { debounce } from "@shared/debounce";
import { gitRemote } from "@shared/vencordUserAgent";
import { classNameFactory } from "@utils/css";
import { proxyLazy } from "@utils/lazy";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { OptionType, Plugin, PluginTag } from "@utils/types";
import { RenderModalProps, User } from "@vencord/discord-types";
import { findCssClassesLazy } from "@webpack";
import { Clickable, FluxDispatcher, Forms, Modal, openModal, React, Text, Tooltip, useEffect, useMemo, UserStore, UserSummaryItem, UserUtils, useState } from "@webpack/common";
import { Constructor } from "type-fest";

import { PluginMeta } from "~plugins";

import { OptionComponentMap } from "./components";
import { openContributorModal } from "./ContributorModal";
import { FavoriteButton, GithubButton, WebsiteButton } from "./PluginModalButtons";

const cl = classNameFactory("vc-plugin-modal-");

const AvatarStyles = findCssClassesLazy("moreUsers", "avatar", "clickableAvatar");
const UserRecord: Constructor<Partial<User>> = proxyLazy(() => UserStore.getCurrentUser().constructor) as any;

const MODAL_BACKGROUND_GIF = "https://i.pinimg.com/originals/1a/69/40/1a694092ffa0bfdb578e716dcf466980.gif";

interface PluginModalProps extends RenderModalProps {
    plugin: Plugin;
    onRestartNeeded(key: string): void;
}

function makeDummyUser(user: { username: string; id?: string; avatar?: string; }) {
    const newUser = new UserRecord({
        username: user.username,
        id: user.id ?? generateId(),
        avatar: user.avatar,
        /** To stop discord making unwanted requests... */
        bot: true,
    });

    FluxDispatcher.dispatch({
        type: "USER_UPDATE",
        user: newUser,
    });

    return newUser;
}

function PluginTags({ tags }: { tags: PluginTag[]; }) {
    return (
        <div className={cl("tags")}>
            {tags.map(tag => (
                <div key={tag} className={cl("tag")} style={{ background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{tag}</div>
            ))}
        </div>
    );
}

export default function PluginModal({ plugin, onRestartNeeded, onClose, transitionState }: PluginModalProps) {
    const pluginSettings = useSettings([`plugins.${plugin.name}.*`]).plugins[plugin.name];
    const hasSettings = hasAnyVisibleSettings(plugin);

    // avoid layout shift by showing dummy users while loading users
    const fallbackAuthors = useMemo(() => [makeDummyUser({ username: "Loading...", id: "-1465912127305809920" })], []);
    const [authors, setAuthors] = useState<Partial<User>[]>([]);

    // للأنيميشن عند فتح النافذة
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsMounted(true));

        (async () => {
            for (const user of plugin.authors.slice(0, 6)) {
                try {
                    const author = user.id
                        ? await UserUtils.getUser(String(user.id))
                            .catch(() => makeDummyUser({ username: user.name }))
                        : makeDummyUser({ username: user.name });

                    setAuthors(a => [...a, author]);
                } catch (e) {
                    continue;
                }
            }
        })();
    }, [plugin.authors]);

    function renderSettings() {
        const { settings } = plugin;
        if (!hasSettings || !settings)
            return <Forms.FormText style={{ color: "#a1a1aa" }}>There are no settings for this plugin.</Forms.FormText>;

        const options = Object.entries(settings.def).map(([key, setting]) => {
            if (setting.type === OptionType.CUSTOM) return null;

            if (isSettingHidden(settings, setting)) return null;

            function onChange(newValue: any) {
                const option = plugin.settings!.def[key];
                if (!option || option.type === OptionType.CUSTOM) return;

                pluginSettings[key] = newValue;

                if (option.restartNeeded) onRestartNeeded(key);
            }

            const Component = OptionComponentMap[setting.type];
            return (
                <ErrorBoundary noop key={key}>
                    <Component
                        id={key}
                        setting={setting}
                        onChange={debounce(onChange)}
                        pluginSettings={pluginSettings}
                        definedSettings={settings}
                        closePluginSettings={onClose}
                    />
                </ErrorBoundary>
            );
        });

        return (
            <div className="vc-plugins-settings" style={{ background: "rgba(0, 0, 0, 0.4)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                {options}
            </div>
        );
    }

    function renderMoreUsers(_label: string, count: number) {
        const sliceCount = plugin.authors.length - count;
        const sliceStart = plugin.authors.length - sliceCount;
        const sliceEnd = sliceStart + plugin.authors.length - count;

        return (
            <Tooltip text={plugin.authors.slice(sliceStart, sliceEnd).map(u => u.name).join(", ")}>
                {({ onMouseEnter, onMouseLeave }) => (
                    <div
                        className={AvatarStyles.moreUsers}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.6)", color: "#fff" }}
                    >
                        +{sliceCount}
                    </div>
                )}
            </Tooltip>
        );
    }

    const pluginMeta = PluginMeta[plugin.name];

    return (
        <div style={{
            opacity: isMounted ? 1 : 0,
            transform: isMounted ? "scale(1) translateY(0)" : "scale(0.95) translateY(10px)",
            transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
            position: "relative",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.9)",
            border: "1px solid rgba(255, 255, 255, 0.2)"
        }}>
            {/* طبقة الـ GIF الخلفية */}
            <img
                src={MODAL_BACKGROUND_GIF}
                alt="Modal Background"
                style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    width: "100%", height: "100%", objectFit: "cover",
                    zIndex: 0, opacity: 0.85, pointerEvents: "none"
                }}
            />

            {/* تدرج لوني لتوضيح المحتوى فوق الـ GIF */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(to bottom, rgba(5,5,8,0.7) 0%, rgba(5,5,8,0.95) 100%)",
                zIndex: 1, pointerEvents: "none"
            }} />

            {/* المحتوى الفعلي للنافذة */}
            <div style={{ position: "relative", zIndex: 2 }}>
                <Modal
                    transitionState={transitionState}
                    onClose={onClose}
                    size="lg"
                    title={
                        <div className={cl("header")} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.15)", paddingBottom: "16px", paddingTop: "8px" }}>
                            <BaseText tag="h1" weight="semibold" size="lg" style={{ color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,1)", fontSize: "24px" }}>
                                {plugin.name}
                            </BaseText>
                            {!pluginMeta.userPlugin && (
                                <div className="vc-settings-modal-links">
                                    <FavoriteButton
                                        isFavorite={pluginSettings.isFavorite ?? false}
                                        onClick={() => pluginSettings.isFavorite = !pluginSettings.isFavorite}
                                    />
                                    <WebsiteButton
                                        text="View more info"
                                        href={`https://vencord.dev/plugins/${plugin.name}`}
                                    />
                                    <GithubButton
                                        text="View source code"
                                        href={`https://github.com/${gitRemote}/tree/main/src/plugins/${pluginMeta.folderName}`}
                                    />
                                </div>
                            )}
                        </div>
                    }
                    subtitle={
                        <div className={cl("info")} style={{ marginTop: "12px" }}>
                            <div>
                                <Forms.FormText style={{ color: "#e4e4e7", fontSize: "15px", lineHeight: "1.5", textShadow: "0 1px 5px rgba(0,0,0,0.9)" }}>
                                    {plugin.description}
                                </Forms.FormText>
                                {!!plugin.tags?.length && <div style={{ marginTop: "12px" }}><PluginTags tags={plugin.tags} /></div>}
                            </div>
                        </div>
                    }
                >
                    <div className={"vc-settings-modal-content"} style={{ padding: "8px 0" }}>
                        <section>
                            <Text variant="heading-lg/semibold" className={classes(Margins.top8, Margins.bottom8)} style={{ color: "#fff", borderBottom: "1px dashed rgba(255,255,255,0.2)", paddingBottom: "8px", marginBottom: "16px" }}>
                                Authors
                            </Text>
                            <div style={{ width: "fit-content", background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <ErrorBoundary noop>
                                    <UserSummaryItem
                                        users={authors.length ? authors : fallbackAuthors}
                                        guildId={undefined}
                                        renderIcon={false}
                                        max={6}
                                        showDefaultAvatarsForNullUsers
                                        renderMoreUsers={renderMoreUsers}
                                        renderUser={(user: User) => (
                                            <Clickable
                                                className={AvatarStyles.clickableAvatar}
                                                onClick={() => openContributorModal(user)}
                                                style={{ transition: "transform 0.2s", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)" }}
                                                onMouseEnter={(e: any) => e.currentTarget.style.transform = "scale(1.15) translateY(-2px)"}
                                                onMouseLeave={(e: any) => e.currentTarget.style.transform = "scale(1) translateY(0)"}
                                            >
                                                <img
                                                    className={AvatarStyles.avatar}
                                                    src={user.getAvatarURL(void 0, 80, true)}
                                                    alt={user.username}
                                                    title={user.username}
                                                />
                                            </Clickable>
                                        )}
                                    />
                                </ErrorBoundary>
                            </div>
                        </section>

                        {!!plugin.settingsAboutComponent && (
                            <div className={Margins.top16}>
                                <section>
                                    <ErrorBoundary message="An error occurred while rendering this plugin's custom Info Component">
                                        <plugin.settingsAboutComponent />
                                    </ErrorBoundary>
                                </section>
                            </div>
                        )}

                        <section style={{ marginTop: "24px" }}>
                            <Text variant="heading-lg/semibold" className={classes(Margins.top16, Margins.bottom8)} style={{ color: "#fff", borderBottom: "1px dashed rgba(255,255,255,0.2)", paddingBottom: "8px", marginBottom: "16px" }}>
                                Settings
                            </Text>
                            {renderSettings()}
                        </section>
                    </div>
                </Modal>
            </div>
        </div>
    );
}

export function openPluginModal(plugin: Plugin, onRestartNeeded?: (pluginName: string, key: string) => void) {
    openModal(modalProps => (
        <PluginModal
            {...modalProps}
            plugin={plugin}
            onRestartNeeded={(key: string) => onRestartNeeded?.(plugin.name, key)}
        />
    ));
}