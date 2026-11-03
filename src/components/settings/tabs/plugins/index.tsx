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

import "./styles.css";

import * as DataStore from "@api/DataStore";
import { isPluginEnabled } from "@api/PluginManager";
import { useSettings } from "@api/Settings";
import { Card } from "@components/Card";
import { Divider } from "@components/Divider";
import ErrorBoundary from "@components/ErrorBoundary";
import { Heading, HeadingTertiary } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { ChangeList } from "@utils/ChangeList";
import { classNameFactory } from "@utils/css";
import { isTruthy } from "@utils/guards";
import { Logger } from "@utils/Logger";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { PluginTarget } from "@utils/pluginTargets";
import { promptToRestart } from "@utils/promptToRestart";
import { useAwaiter, useCleanupEffect } from "@utils/react";
import { PluginTag, PluginTags } from "@utils/types";
import { Button, lodash, React, SearchableSelect, Select, TextInput, Tooltip, useMemo, useRef, useState } from "@webpack/common";
import { JSX } from "react";

import Plugins, { ExcludedPlugins, PluginMeta } from "~plugins";

import { PluginCard } from "./PluginCard";
import { UIElementsButton } from "./UIElements";

export const cl = classNameFactory("vc-plugins-");
export const logger = new Logger("PluginSettings", "#a6d189");

// الـ GIF الجديد اللي طلبته
const NEW_BANNER_GIF = "https://i.pinimg.com/originals/67/38/63/67386362c44f180455b7668fe70d5059.gif";

// البانر العلوي بالثيم القديم المرتب مع الـ GIF الجديد
function ReloadRequiredCard({ required }: { required: boolean; }) {
    return (
        <div style={{
            background: required ? "linear-gradient(90deg, #3a1a1a 0%, #1a0a0a 100%)" : "linear-gradient(90deg, #111115 0%, #09090b 100%)",
            border: `1px solid ${required ? "rgba(255, 60, 60, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)"
        }}>
            <div style={{ flex: 1 }}>
                {required
                    ? (
                        <>
                            <HeadingTertiary style={{ color: "#ff4d4d", fontSize: "18px", fontWeight: "bold" }}>
                                Restart required!
                            </HeadingTertiary>
                            <Paragraph style={{ color: "#d1d1d6", marginTop: "6px" }}>
                                Restart now to apply new plugins and their settings
                            </Paragraph>
                            <Button onClick={() => location.reload()} style={{ marginTop: "12px", background: "#ff4d4d", color: "#fff", fontWeight: "bold" }}>
                                Restart
                            </Button>
                        </>
                    )
                    : (
                        <>
                            <HeadingTertiary style={{ color: "#ffffff", fontSize: "18px", fontWeight: "bold" }}>
                                Plugin Management
                            </HeadingTertiary>
                            <Paragraph style={{ color: "#a1a1aa", marginTop: "6px", fontSize: "14px" }}>
                                Press the cog wheel or info icon to get more info on a plugin.
                            </Paragraph>
                            <Paragraph style={{ color: "#a1a1aa", marginTop: "4px", fontSize: "14px" }}>
                                Plugins with a cog wheel have settings you can modify!
                            </Paragraph>
                        </>
                    )}
            </div>
            <div>
                <img
                    src={NEW_BANNER_GIF}
                    alt="Banner"
                    style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "12px",
                        objectFit: "cover",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)"
                    }}
                />
            </div>
        </div>
    );
}

const enum SearchStatus {
    ALL,
    FAVORITES,
    ENABLED,
    DISABLED,
    NEW,
    USER_PLUGINS,
    API_PLUGINS
}

function ExcludedPluginsList({ search }: { search: string; }) {
    const matchingExcludedPlugins = search
        ? Object.entries(ExcludedPlugins)
            .filter(([name]) => name.toLowerCase().includes(search))
        : [];

    const ExcludedReasons: Record<PluginTarget, string> = {
        desktop: "Discord Desktop app or Vesktop",
        discordDesktop: "Discord Desktop app",
        vesktop: "Vesktop app",
        web: "Vesktop app and the Web version of Discord",
        dev: "Developer version of Vencord",
        browser: "Web Browser version of Vencord"
    };

    return (
        <Paragraph className={Margins.top16} style={{ color: "#a1a1aa" }}>
            {matchingExcludedPlugins.length
                ? <>
                    <Paragraph style={{ color: "#fff" }}>Are you looking for:</Paragraph>
                    <ul style={{ color: "#a1a1aa" }}>
                        {matchingExcludedPlugins.map(([name, reason]) => (
                            <li key={name}>
                                <b style={{ color: "#fff" }}>{name}</b>: Only available on the {ExcludedReasons[reason]}
                            </li>
                        ))}
                    </ul>
                </>
                : "No plugins meet the search criteria."
            }
        </Paragraph>
    );
}

function PluginSettings() {
    const settings = useSettings();
    const changeRef = useRef<ChangeList<string>>(null);
    const changes = changeRef.current ??= new ChangeList<string>();

    useCleanupEffect(() => {
        if (changes.hasChanges)
            promptToRestart("reload", {
                children: <>
                    <Heading tag="h5">The following plugins require a restart:</Heading>
                    <Paragraph>{Array.from(changes, k => k.split(".")[0]).join(", ")}</Paragraph>
                </>
            });
    }, []);

    const depMap = useMemo(() => {
        const o = {} as Record<string, string[]>;
        for (const plugin in Plugins) {
            const deps = Plugins[plugin].dependencies;
            if (deps) {
                for (const dep of deps) {
                    o[dep] ??= [];
                    o[dep].push(plugin);
                }
            }
        }
        return o;
    }, []);

    const sortedPlugins = useMemo(() =>
        Object.values(Plugins).sort((a, b) => a.name.localeCompare(b.name)),
        []
    )
        .toSorted((a, b) => Number(settings.plugins[b.name]?.isFavorite ?? false) - Number(settings.plugins[a.name]?.isFavorite ?? false));

    const hasUserPlugins = useMemo(() => !IS_STANDALONE && Object.values(PluginMeta).some(m => m.userPlugin), []);

    const [searchValue, setSearchValue] = useState({ value: "", tags: [] as PluginTag[], status: SearchStatus.ALL });

    const search = searchValue.value.toLowerCase();
    const onSearch = (query: string) => setSearchValue(prev => ({ ...prev, value: query }));

    const pluginFilter = (plugin: typeof Plugins[keyof typeof Plugins]) => {
        const { status, tags } = searchValue;

        switch (status) {
            case SearchStatus.FAVORITES:
                if (!settings.plugins[plugin.name]?.isFavorite) return false;
                break;
            case SearchStatus.DISABLED:
                if (isPluginEnabled(plugin.name)) return false;
                break;
            case SearchStatus.ENABLED:
                if (!isPluginEnabled(plugin.name)) return false;
                break;
            case SearchStatus.NEW:
                if (!newPlugins?.includes(plugin.name)) return false;
                break;
            case SearchStatus.USER_PLUGINS:
                if (!PluginMeta[plugin.name]?.userPlugin) return false;
                break;
            case SearchStatus.API_PLUGINS:
                if (!plugin.name.endsWith("API")) return false;
                break;
        }

        if (tags.length && tags.some(t => !plugin.tags?.includes(t))) return false;

        if (!search.length) return true;

        return (
            plugin.name.toLowerCase().includes(search) ||
            plugin.name.match(/[A-Z]/g)?.join("").toLowerCase().includes(search) ||
            plugin.description.toLowerCase().includes(search) ||
            plugin.searchTerms?.some(t => t.toLowerCase().includes(search))
        );
    };

    const [newPlugins] = useAwaiter(() => DataStore.get("Vencord_existingPlugins").then((cachedPlugins: Record<string, number> | undefined) => {
        const now = Date.now() / 1000;
        const existingTimestamps: Record<string, number> = {};
        const sortedPluginNames = Object.values(sortedPlugins).map(plugin => plugin.name);

        const newPlugins: string[] = [];
        for (const { name: p } of sortedPlugins) {
            const time = existingTimestamps[p] = cachedPlugins?.[p] ?? now;
            if ((time + 60 * 60 * 24 * 2) > now) {
                newPlugins.push(p);
            }
        }
        DataStore.set("Vencord_existingPlugins", existingTimestamps);

        return lodash.isEqual(newPlugins, sortedPluginNames) ? [] : newPlugins;
    }));

    const plugins = [] as JSX.Element[];
    const requiredPlugins = [] as JSX.Element[];

    const showApi = searchValue.status === SearchStatus.API_PLUGINS;
    for (const p of sortedPlugins) {
        if (p.hidden || (!p.settings && p.name.endsWith("API") && !showApi))
            continue;

        if (!pluginFilter(p)) continue;

        const isRequired = p.required || p.isDependency || depMap[p.name]?.some(d => settings.plugins[d].enabled);

        if (isRequired) {
            const tooltipText = p.required || !depMap[p.name]
                ? "This plugin is required for 2gv5cord to function."
                : makeDependencyList(depMap[p.name]?.filter(d => settings.plugins[d].enabled));

            requiredPlugins.push(
                <Tooltip text={tooltipText} key={p.name}>
                    {({ onMouseLeave, onMouseEnter }) => (
                        <PluginCard
                            onMouseLeave={onMouseLeave}
                            onMouseEnter={onMouseEnter}
                            onRestartNeeded={(name, key) => changes.handleChange(`${name}.${key}`)}
                            disabled={true}
                            plugin={p}
                            key={p.name}
                        />
                    )}
                </Tooltip>
            );
        } else {
            plugins.push(
                <PluginCard
                    onRestartNeeded={(name, key) => changes.handleChange(`${name}.${key}`)}
                    disabled={false}
                    plugin={p}
                    isNew={newPlugins?.includes(p.name)}
                    key={p.name}
                />
            );
        }
    }

    return (
        <SettingsTab>
            {/* CSS احترافي للأنيميشن وتنسيق البلاكنات والخط الفاصل */}
            <style>{`
                .vc-2gv5-dark-plugins {
                    background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 0);
                    background-size: 20px 20px;
                    min-height: 100%;
                    padding-bottom: 30px;
                }
                
                /* تصميم بطاقة البلاكن الأساسي */
                .vc-2gv5-dark-plugins .vc-plugins-grid > * {
                    background: linear-gradient(145deg, #09090b 0%, #121216 100%) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                /* تأثير الأنيميشن عند وضع الماوس (Hover) */
                .vc-2gv5-dark-plugins .vc-plugins-grid > *:hover {
                    border-color: rgba(255, 255, 255, 0.25) !important;
                    transform: translateY(-4px) !important;
                    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.7) !important;
                }

                /* الخط الفاصل تحت اسم البلاكن (زي ما طلبت في الصورة) */
                .vc-2gv5-dark-plugins .vc-plugins-grid > * > :first-child {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                    padding-bottom: 12px !important;
                    margin-bottom: 12px !important;
                }

                /* لمعان خفيف من فوق لما تحط الماوس */
                .vc-2gv5-dark-plugins .vc-plugins-grid > *::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .vc-2gv5-dark-plugins .vc-plugins-grid > *:hover::before {
                    opacity: 1;
                }

                /* تنسيق الفلاتر والبحث */
                .vc-2gv5-dark-plugins input,
                .vc-2gv5-dark-plugins [class*="select-"],
                .vc-2gv5-dark-plugins [class*="control-"] {
                    background-color: #050505 !important;
                    border: 1px solid rgba(255, 255, 255, 0.15) !important;
                    color: #ffffff !important;
                    transition: border-color 0.2s;
                }
                .vc-2gv5-dark-plugins input:focus {
                    border-color: rgba(255, 255, 255, 0.5) !important;
                }
                .vc-2gv5-dark-plugins h5, .vc-2gv5-dark-plugins h3 {
                    color: #ffffff !important;
                    font-weight: bold;
                }
            `}</style>

            <div className="vc-2gv5-dark-plugins">
                <ReloadRequiredCard required={changes.hasChanges} />

                <UIElementsButton />

                <HeadingTertiary className={classes(Margins.top20, Margins.bottom8)}>
                    Filters
                </HeadingTertiary>

                <ErrorBoundary noop>
                    <TextInput
                        inputClassName={cl("filter-control")}
                        placeholder="Search for a plugin..."
                        value={searchValue.value}
                        onChange={onSearch}
                        autoFocus
                    />
                </ErrorBoundary>

                <ErrorBoundary noop>
                    <div className={classes(Margins.bottom20, Margins.top8, cl("filter-controls"))}>
                        <Select
                            options={[
                                { label: "Show All", value: SearchStatus.ALL, default: true },
                                { label: "Show Favorites ⭐", value: SearchStatus.FAVORITES },
                                { label: "Show Enabled", value: SearchStatus.ENABLED },
                                { label: "Show Disabled", value: SearchStatus.DISABLED },
                                { label: "Show New", value: SearchStatus.NEW },
                                hasUserPlugins && { label: "Show UserPlugins", value: SearchStatus.USER_PLUGINS },
                                { label: "Show API Plugins", value: SearchStatus.API_PLUGINS },
                            ].filter(isTruthy)}
                            serialize={String}
                            select={status => setSearchValue(prev => ({ ...prev, status }))}
                            isSelected={v => v === searchValue.status}
                            closeOnSelect={true}
                            placeholder="Filter by Type"
                        />
                        <SearchableSelect
                            options={PluginTags.map(tag => ({ label: tag, value: tag }))}
                            value={searchValue.tags}
                            onChange={tags => setSearchValue(prev => ({ ...prev, tags }))}
                            closeOnSelect={false}
                            placeholder="Filter by Tags"
                            multi
                        />
                    </div>
                </ErrorBoundary>

                <HeadingTertiary className={Margins.top20}>2gv5cord Plugins</HeadingTertiary>

                {plugins.length || requiredPlugins.length
                    ? (
                        <div className={cl("grid")}>
                            {plugins.length
                                ? plugins
                                : <Paragraph style={{ color: "#a1a1aa" }}>No plugins meet the search criteria.</Paragraph>
                            }
                        </div>
                    )
                    : <ExcludedPluginsList search={search} />
                }

                <Divider className={Margins.top20} />

                <HeadingTertiary className={classes(Margins.top20, Margins.bottom8)}>
                    Required Plugins
                </HeadingTertiary>

                <div className={cl("grid")}>
                    {requiredPlugins.length
                        ? requiredPlugins
                        : <Paragraph style={{ color: "#a1a1aa" }}>No required plugins meet the search criteria.</Paragraph>
                    }
                </div>
            </div>
        </SettingsTab >
    );
}

function makeDependencyList(deps: string[]) {
    return (
        <>
            <Paragraph>This plugin is required by:</Paragraph>
            {deps.map((dep: string) => <Paragraph key={dep} className={cl("dep-text")}>{dep}</Paragraph>)}
        </>
    );
}

export default wrapTab(PluginSettings, "2gv5cord Plugins");