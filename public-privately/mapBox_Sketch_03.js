/*
 * ASSIGNMENT 6: GEOSPATIAL STRUCTURES
 * PUBLIC BY LAW
 * Open and Interior Privately Owned Public Spaces in New York City
 */

var mapboxSketch03 = function () {
    // Replace this token only if you create a new Mapbox account/token.
    mapboxgl.accessToken =
        'pk.eyJ1IjoiYmhkaHRqaCIsImEiOiJjbWk1bHVwMHkxYzEwMmxzMDFwMWFoczZmIn0.ErAnQ5c99Gq_b_o84QtQfA';

    // ============================================================
    // VISUAL SETTINGS — EDIT THESE VALUES
    // ============================================================

    // After publishing a custom style in Mapbox Studio, replace this URL.
    const BASEMAP_STYLE = 'mapbox://styles/bhdhtjh/cmrvhxunf00fd01s1307l9b0d';

    // Point colors remain controlled here, not in Mapbox Studio.
    const OPEN_SPACE_COLOR = '#E3C95E';
    const INTERIOR_SPACE_COLOR = '#8F9D82';

    const map3 = new mapboxgl.Map({
        container: 'mapbox-container-3',
        style: BASEMAP_STYLE,
        center: [-73.9857, 40.7580],
        zoom: 11,
        pitch: 0,
        bearing: 0
    });

    map3.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map3.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map3.addControl(
        new mapboxgl.ScaleControl({ maxWidth: 90, unit: 'metric' }),
        'bottom-left'
    );

    map3.on('load', function () {
        fetch('public_spaces.geojson')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(function (data) {
                map3.addSource('public-spaces-data', {
                    type: 'geojson',
                    data: data
                });

                const amenityRadius = [
                    'interpolate',
                    ['linear'],
                    ['coalesce', ['to-number', ['get', 'amenity_count']], 0],
                    0, 4,
                    3, 6,
                    6, 9,
                    10, 13,
                    18, 18
                ];

                function addSpaceLayer(layerId, category, color) {
                    map3.addLayer({
                        id: layerId,
                        type: 'circle',
                        source: 'public-spaces-data',
                        filter: ['==', ['get', 'space_category'], category],
                        paint: {
                            'circle-radius': amenityRadius,
                            'circle-color': color,
                            'circle-opacity': 0.45,
                            'circle-stroke-width': 0
                        }
                    });
                }

                addSpaceLayer('open-space-points', 'Open Space', OPEN_SPACE_COLOR);
                addSpaceLayer('interior-space-points', 'Interior Space', INTERIOR_SPACE_COLOR);

                const bounds = new mapboxgl.LngLatBounds();
                data.features.forEach(function (feature) {
                    if (feature.geometry && feature.geometry.type === 'Point') {
                        bounds.extend(feature.geometry.coordinates);
                    }
                });

                function fitToData() {
                    if (!bounds.isEmpty()) {
                        map3.fitBounds(bounds, {
                            padding: 55,
                            duration: 1400,
                            maxZoom: 14
                        });
                    }
                }

                fitToData();

                function addHoverEffect(layerId) {
                    map3.on('mouseenter', layerId, function () {
                        map3.getCanvas().style.cursor = 'pointer';
                        map3.setPaintProperty(layerId, 'circle-opacity', 0.75
                        
                        );
                    });

                    map3.on('mouseleave', layerId, function () {
                        map3.getCanvas().style.cursor = '';
                        map3.setPaintProperty(layerId, 'circle-opacity', 0.45);
                    });
                }

                addHoverEffect('open-space-points');
                addHoverEffect('interior-space-points');

                function safeValue(value, fallback) {
                    if (value === null || value === undefined || String(value).trim() === '') {
                        return fallback;
                    }
                    return value;
                }

                function createPopup(event) {
                    const feature = event.features[0];
                    const properties = feature.properties;
                    const coordinates = feature.geometry.coordinates.slice();

                    const name = safeValue(
                        properties.principal_public_space || properties.building_name,
                        'Unnamed Public Space'
                    );
                    const category = safeValue(properties.space_category, 'Not specified');
                    const originalType = safeValue(properties.public_space_type, 'Not specified');
                    const address = safeValue(properties.building_address_with_zip, 'Address unavailable');
                    const accessHours = safeValue(properties.hour_of_access_required, 'Not specified');
                    const amenities = safeValue(properties.amenities_required, 'None recorded');
                    const amenityCount = Number(properties.amenity_count || 0);
                    const accessibility = safeValue(properties.physically_disabled, 'Not specified');

                    const popupHTML = `
                        <article class="popup-card" style="width:250px; line-height:1.45;">
                            <div style="font-size:10px; text-transform:uppercase; letter-spacing:.08em; opacity:.62; margin-bottom:7px;">
                                ${category}
                            </div>
                            <h3 style="font-size:16px; font-weight:400; line-height:1.25; margin:0 0 12px;">
                                ${name}
                            </h3>
                            <p style="margin:6px 0;"><strong>Official type</strong><br>${originalType}</p>
                            <p style="margin:6px 0;"><strong>Address</strong><br>${address}</p>
                            <p style="margin:6px 0;"><strong>Access hours</strong><br>${accessHours}</p>
                            <p style="margin:6px 0;"><strong>Amenities (${amenityCount})</strong><br>${amenities}</p>
                            <p style="margin:6px 0;"><strong>Accessibility</strong><br>${accessibility}</p>
                        </article>
                    `;

                    new mapboxgl.Popup({ closeButton: true, closeOnClick: true, offset: 9 })
                        .setLngLat(coordinates)
                        .setHTML(popupHTML)
                        .addTo(map3);
                }

                map3.on('click', 'open-space-points', createPopup);
                map3.on('click', 'interior-space-points', createPopup);

                const categoryFilters = {
                    'open-space-points': ['==', ['get', 'space_category'], 'Open Space'],
                    'interior-space-points': ['==', ['get', 'space_category'], 'Interior Space']
                };

                const searchInput = document.getElementById('searchFeature');
                const resetButton = document.getElementById('resetFilters');
                const fitButton = document.getElementById('fitToData');

                function applySearch(searchTerm) {
                    const normalizedTerm = searchTerm.trim().toLowerCase();

                    Object.keys(categoryFilters).forEach(function (layerId) {
                        if (!normalizedTerm) {
                            map3.setFilter(layerId, categoryFilters[layerId]);
                            return;
                        }

                        const textSearch = [
                            'any',
                            ['in', normalizedTerm, ['downcase', ['coalesce', ['get', 'principal_public_space'], '']]],
                            ['in', normalizedTerm, ['downcase', ['coalesce', ['get', 'building_name'], '']]],
                            ['in', normalizedTerm, ['downcase', ['coalesce', ['get', 'building_address_with_zip'], '']]],
                            ['in', normalizedTerm, ['downcase', ['coalesce', ['get', 'public_space_type'], '']]]
                        ];

                        map3.setFilter(layerId, ['all', categoryFilters[layerId], textSearch]);
                    });
                }

                if (searchInput) {
                    searchInput.addEventListener('input', function (event) {
                        applySearch(event.target.value);
                    });
                }

                if (resetButton) {
                    resetButton.addEventListener('click', function () {
                        if (searchInput) searchInput.value = '';
                        applySearch('');
                    });
                }

                if (fitButton) {
                    fitButton.addEventListener('click', fitToData);
                }

                const mapContainer = document.getElementById('mapbox-container-3');

                const layerControl = document.createElement('div');
                layerControl.className = 'map-overlay layer-control';
                layerControl.innerHTML = `
                    <div class="overlay-title">Space category</div>
                    <label class="layer-row">
                        <input type="checkbox" id="toggle-open-space" checked>
                        <span class="category-dot" style="background:${OPEN_SPACE_COLOR}"></span>
                        <span>Open Space</span>
                    </label>
                    <label class="layer-row">
                        <input type="checkbox" id="toggle-interior-space" checked>
                        <span class="category-dot" style="background:${INTERIOR_SPACE_COLOR}"></span>
                        <span>Interior Space</span>
                    </label>
                    <div class="overlay-note">Uncheck a category to hide its layer.</div>
                `;
                mapContainer.appendChild(layerControl);

                const legend = document.createElement('div');
                legend.className = 'map-overlay map-legend';
                legend.innerHTML = `
                    <div class="overlay-title">Map key</div>
                    <div class="legend-row">
                        <span class="category-dot" style="background:${OPEN_SPACE_COLOR}"></span>
                        <span>Open Space</span>
                    </div>
                    <div class="legend-row">
                        <span class="category-dot" style="background:${INTERIOR_SPACE_COLOR}"></span>
                        <span>Interior Space</span>
                    </div>
                    <div class="size-key" aria-label="Point size represents amenity count">
                        <span class="size-circle" style="width:8px;height:8px"></span>
                        <span class="size-circle" style="width:14px;height:14px"></span>
                        <span class="size-circle" style="width:22px;height:22px"></span>
                    </div>
                    <div class="overlay-note">Point size = number of required amenities</div>
                `;
                mapContainer.appendChild(legend);

                function bindLayerToggle(inputId, layerId) {
                    const checkbox = document.getElementById(inputId);
                    checkbox.addEventListener('change', function () {
                        map3.setLayoutProperty(
                            layerId,
                            'visibility',
                            checkbox.checked ? 'visible' : 'none'
                        );
                    });
                }

                bindLayerToggle('toggle-open-space', 'open-space-points');
                bindLayerToggle('toggle-interior-space', 'interior-space-points');

                document.addEventListener('keydown', function (event) {
                    const activeTag = document.activeElement ? document.activeElement.tagName : '';
                    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

                    if (event.key.toLowerCase() === 'f') fitToData();
                    if (event.key.toLowerCase() === 'r' && resetButton) resetButton.click();
                });
            })
            .catch(function (error) {
                console.error('Error loading POPS GeoJSON:', error);
                const mapContainer = document.getElementById('mapbox-container-3');
                mapContainer.innerHTML = '<p style="padding:20px">The GeoJSON file could not be loaded. Run this folder through a local server or GitHub Pages.</p>';
            });
    });
};

mapboxSketch03();
