(function () {
  L.Control.ListMarkers = L.Control.extend({
    includes: L.version[0] === '1' ? L.Evented.prototype : L.Mixin.Events,

    options: {
      layer: false,
      maxItems: 500,
      collapsed: false,
      label: 'title',
      itemIcon: L.Icon.Default.imagePath + '/icon_page.svg',
      maxZoom: 18,
      position: 'bottomleft',
    },

    initialize: function (options) {
      L.Util.setOptions(this, options);
      this._container = null;
      this._list = null;
      this._listCount = null;
      this._layer = this.options.layer || new L.LayerGroup();
    },

    onAdd: function (map) {
      this._map = map;

      const container = (this._container = L.DomUtil.create(
        'div',
        'list-markers',
      ));

      this._list = L.DomUtil.create('div', 'list-markers-list', container);

      this._listCount = document.querySelector('.panel__tabs__list__count');

      this._initToggle();

      map.on('moveend', this._updateList, this);

      this._updateList();
      return container;
    },

    onRemove: function (map) {
      map.off('moveend', this._updateList, this);
      this._container = null;
      this._list = null;
    },

    _createItem: function (layer) {
      const markerItemDiv = L.DomUtil.create('div', 'list-markers-item'),
        referenceDiv = L.DomUtil.create(
          'div',
          'list-marker__link',
          markerItemDiv,
        ),
        informationDiv = L.DomUtil.create(
          'div',
          'list-marker__info',
          markerItemDiv,
        ),
        pageIndicatorDiv = L.DomUtil.create(
          'div',
          'list-marker__page-indicator',
          markerItemDiv,
        ),
        a = L.DomUtil.create('a', '', referenceDiv),
        icon = this.options.itemIcon
          ? '<img src="' + this.options.itemIcon + '" />'
          : '',
        that = this;

      a.href = '#';
      pageIndicatorDiv.innerHTML = `${layer.options.pageIndicator}`;
      informationDiv.innerHTML = `${layer.options.siteInformation}`;
      L.DomEvent.disableClickPropagation(a)
        .on(a, 'click', L.DomEvent.stop, this)
        .on(
          a,
          'click',
          function (e) {
            this._moveTo(layer.getLatLng());
            layer.openPopup();
          },
          this,
        )
        .on(
          a,
          'mouseover',
          function (e) {
            that.fire('item-mouseover', { layer: layer });
          },
          this,
        )
        .on(
          a,
          'mouseout',
          function (e) {
            that.fire('item-mouseout', { layer: layer });
          },
          this,
        );

      //console.log('_createItem',layer.options);

      if (layer.options.hasOwnProperty(this.options.label)) {
        a.innerHTML = `<span> ${layer.options[this.options.label]} </span>`;
      } else
        console.log(
          "propertyName '" + this.options.label + "' not found in marker",
        );

      return markerItemDiv;
    },

    _updateList: function () {
      let that = this,
        n = 0;

      this._list.innerHTML = '';
      this._layer.eachLayer(function (layer) {
        if (layer instanceof L.Marker)
          if (that._map.getBounds().contains(layer.getLatLng()))
            if (++n < that.options.maxItems)
              that._list.appendChild(that._createItem(layer));
      });

      this._listCount.innerHTML = ` (${n})`;
    },

    _initToggle: function () {
      /* inspired by L.Control.Layers */

      const container = this._container;

      //Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
      container.setAttribute('aria-haspopup', true);

      if (!L.Browser.touch) {
        L.DomEvent.disableClickPropagation(container);
        //.disableScrollPropagation(container);
      } else {
        L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
      }

      if (this.options.collapsed) {
        this._collapse();

        if (!L.Browser.android) {
          L.DomEvent.on(container, 'mouseover', this._expand, this).on(
            container,
            'mouseout',
            this._collapse,
            this,
          );
        }
        const link = (this._button = L.DomUtil.create(
          'a',
          'list-markers-toggle',
          container,
        ));
        link.href = '#';
        link.title = 'List Markers';

        if (L.Browser.touch) {
          L.DomEvent.on(link, 'click', L.DomEvent.stop).on(
            link,
            'click',
            this._expand,
            this,
          );
        } else {
          L.DomEvent.on(link, 'focus', this._expand, this);
        }

        this._map.on('click', this._collapse, this);
        // TODO keyboard accessibility
      }
    },

    _expand: function () {
      this._container.className = this._container.className.replace(
        ' list-markers-collapsed',
        '',
      );
    },

    _collapse: function () {
      L.DomUtil.addClass(this._container, 'list-markers-collapsed');
    },

    _moveTo: function (latlng) {
      if (this.options.maxZoom)
        this._map.setView(
          latlng,
          Math.max(this._map.getZoom(), this.options.maxZoom),
        );
      else this._map.panTo(latlng);
    },
  });

  L.control.listMarkers = function (options) {
    return new L.Control.ListMarkers(options);
  };

  L.Map.addInitHook(function () {
    if (this.options.listMarkersControl) {
      this.listMarkersControl = L.control.listMarkers(
        this.options.listMarkersControl,
      );
      this.addControl(this.listMarkersControl);
    }
  });
}).call(this);
