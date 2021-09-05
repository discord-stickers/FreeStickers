/**
 * @name FreeCommunityStickers
 * @authorLink https://github.com/discord-stickers
 * @website https://github.com/discord-stickers/FreeCommunityStickers
 * @source https://raw.githubusercontent.com/discord-stickers/FreeCommunityStickers/main/FreeCommunityStickers.plugin.js
 * @updateUrl https://raw.githubusercontent.com/discord-stickers/FreeCommunityStickers/main/FreeCommunityStickers.plugin.js
 */
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {"info":{"name":"FreeCommunityStickers","authors":[{"name":"lemons","discord_id":"407348579376693260","github_username":"respecting"}, {"name":"creatable","discord_id":"597905003717459968","github_username":"Cr3atable"}],"version":"1.2.1","description":"Unlocking Discord Stickers for everyone.","github":"https://github.com/discord-stickers/FreeCommunityStickers","github_raw":"https://raw.githubusercontent.com/discord-stickers/FreeCommunityStickers/main/FreeCommunityStickers.plugin.js"},"main":"index.js"};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {

    const {Patcher, WebpackModules, DiscordAPI, Toasts} = Library,
        getStickerSendability = WebpackModules.getByProps("getStickerSendability"),
        isSendableSticker = WebpackModules.getByProps("isSendableSticker"),
        { getStickerAssetUrl } = WebpackModules.getByProps("getStickerAssetUrl"),
        { ComponentDispatch } = WebpackModules.getByProps("ComponentDispatch"),
        { closeExpressionPicker } =  WebpackModules.getByProps("closeExpressionPicker"),
        { input, disabled } = WebpackModules.getByProps("disabled", "tagLabel"),
        { stickerAsset } = WebpackModules.getByProps("stickerAsset"),
        { stickerUnsendable } = WebpackModules.getByProps("stickerUnsendable"),
        unpatch = [];

    return class FreeCommunityStickers extends Plugin {
        constructor() {
            super();
        }
        
        onStart() {
            if (DiscordAPI.currentUser.discordObject.premiumType == 2) return Toasts.error("You cannot use FreeCommunityStickers with Nitro.");

            // inject CSS to remove grayscale
            BdApi.injectCSS("clean", `.${stickerUnsendable} {
                webkit-filter: grayscale(0%) !important;
                filter: grayscale(0%) !important;
            }`);
		
	        // patch getStickerSendability to send sticker url
            unpatch.push(Patcher.before(getStickerSendability, "getStickerSendability", (_, [args]) => {
                if (!document.querySelector(`.${stickerAsset}:hover`)) return; // check if hovering over sticker to prevent bugs
                if (args.format_type == 3 || args?.sort_value) return closeExpressionPicker();
                closeExpressionPicker();
                return ComponentDispatch.dispatchToLastSubscribed("INSERT_TEXT", {
                    content: ` ${getStickerAssetUrl(args).replace(/=[0-9]{3}/g, "=160")}`
                });
            }));

            // patch isSendableSticker to make search work
            unpatch.push(Patcher.after(isSendableSticker, "isSendableSticker", () => {
                if (!document.querySelector(`.${input}`) && !document.querySelector(`.${disabled}`)) return;
                document.querySelector(`.${input}`)?.removeAttribute("disabled");
                document.querySelector(`.${input}`).placeholder = "Search for stickers";
                document.querySelector(`.${disabled}`)?.classList.remove(disabled);
            }));
        }

        onStop() {
            // unpatch
            unpatch.forEach(patch => {
                patch();
            });
            BdApi.clearCSS("clean");
        }
    }
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
