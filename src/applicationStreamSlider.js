'use strict';

const { BoxLayout, Label } = imports.gi.St;

// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/status/volume.js
const Volume = imports.ui.status.volume;

export const ApplicationStreamSlider = class extends Volume.StreamSlider {
  constructor(stream, showDesc, menu) {
    super(Volume.getMixerControl());

    this.stream = stream;
    this._icon.icon_name = stream.get_icon_name();

    let name = stream.get_name();
    let description = stream.get_description();

    
    if (name || description) {
      
      if (name) {
        let name_base = menu._streamNameBases.indexOf(name);
        if (name_base >= 0 && name_base < menu._streamNameReplacements.length) {
          name = menu._streamNameReplacements[name_base];
        }
      }
      else {
        let name_base = menu._streamNameBases.indexOf(description);
        if (name_base >= 0 && name_base < menu._streamNameReplacements.length) {
          description = menu._streamNameReplacements[name_base];
        }
      }

      this._vbox = new BoxLayout()
      this._vbox.vertical = true;

      this._label = new Label();
      this._label.text = name && showDesc ? `${name} - ${description}` : (name || description);
      this._vbox.add(this._label);

      this.item.remove_child(this._slider);
      this._vbox.add(this._slider);
      this._slider.set_height(32);

      this.item.actor.add(this._vbox);
    }
  }
};
