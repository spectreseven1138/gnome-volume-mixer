'use strict';

import { ApplicationStreamSlider } from "./applicationStreamSlider";

const { Settings, SettingsSchema, SettingsSchemaSource } = imports.gi.Gio;
const { MixerControl, MixerSinkInput } = imports.gi.Gvc;

// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/popupMenu.js
const PopupMenu = imports.ui.popupMenu;
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/status/volume.js
const Volume = imports.ui.status.volume;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

export class VolumeMixerPopupMenuClass extends PopupMenu.PopupMenuSection {
    constructor() {
        super();
        this._applicationStreams = {};

        // The PopupSeparatorMenuItem needs something above and below it or it won't display
        this._hiddenItem = new PopupMenu.PopupBaseMenuItem();
        this._hiddenItem.set_height(0)
        this.addMenuItem(this._hiddenItem);

        this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._control = Volume.getMixerControl();
        this._streamAddedEventId = this._control.connect("stream-added", this._streamAdded.bind(this));
        this._streamRemovedEventId = this._control.connect("stream-removed", this._streamRemoved.bind(this));

        let gschema = SettingsSchemaSource.new_from_directory(
            Me.dir.get_child('schemas').get_path(),
            SettingsSchemaSource.get_default(),
            false
        );

        this.settings = new Settings({
            settings_schema: gschema.lookup('net.evermiss.mymindstorm.volume-mixer', true)
        });

        this._settingsChangedId = this.settings.connect('changed', () => this._updateStreams());

        this._updateStreams();
    }

    _streamAdded(control, id) {
        if (id in this._applicationStreams) {
            return;
        }

        const stream = control.lookup_stream_id(id);

        if (stream.is_event_stream ||
            !(stream instanceof MixerSinkInput) ||
            this._ignoredStreams.indexOf(stream.get_name()) !== -1) {
            return;
        }

        this._applicationStreams[id] = new ApplicationStreamSlider(stream, this._showStreamDesc, this);
        this.addMenuItem(this._applicationStreams[id].item);
    }

    _streamRemoved(_control, id) {
        if (id in this._applicationStreams) {
            this._applicationStreams[id].item.destroy();
            delete this._applicationStreams[id];
        }
    }

    _updateStreams() {
        for (const id in this._applicationStreams) {
            this._applicationStreams[id].item.destroy();
            delete this._applicationStreams[id];
        }

        this._ignoredStreams = this.settings.get_strv("ignored-streams");
        this._streamNameBases = this.settings.get_strv("stream-name-bases");
        this._streamNameReplacements = this.settings.get_strv("stream-name-replacements");
        this._showStreamDesc = this.settings.get_boolean("show-description");

        for (const stream of this._control.get_streams()) {
            this._streamAdded(this._control, stream.get_id())
        }
    }

    destroy() {
        this._control.disconnect(this._streamAddedEventId);
        this._control.disconnect(this._streamRemovedEventId);
        this.settings.disconnect(this._settingsChangedId);
        super.destroy();
    }
};

export var VolumeMixerPopupMenu = VolumeMixerPopupMenuClass;
