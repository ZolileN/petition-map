// get the width of the area we're displaying in
var width;
// but we're using the full window height
var height;

// variables for map drawing
var projection, svg, path, g;
var boundaries, units;

function compute_size() {
    var margin = 50;
    width = parseInt(d3.select("#map").style("width"));
    height = window.innerHeight - margin;
}

compute_size();
// initialise the map
init(width, height);

function clear_info() {
    $('#data_table').hide();
    $('#data_table').empty();
}

function init(width, height) {

    // pretty boring projection
    projection = d3.geo.albers()
        .rotate([0, 0]);

    path = d3.geo.path()
        .projection(projection);

    // create the svg element for drawing onto
    svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
            .call(d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", zoom))
        .append("g");

    // graphics go here
    g = svg.append("g");
}

function zoom() {
  svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

// select a map area
function select(d) {
    var petition_id = localStorage.getItem("petition_id");

    $('#data_table').empty();
    $('#data_table').show();
    $('#data_table').append('<table></table>');
    $.getJSON("https://preview.epetitions.website/petitions/" + petition_id + ".json", function (data) {
        var name;
        var mp;
        var count;
        $.each(data.data.attributes.signatures_by_constituency, function(i, v) {
                if (v.ons_code === d.id) {
                    name = v.name;
                    mp = v.mp;
                    count = v.signature_count;
                    return;
                }
        });
        var name_html = "<div id=\"data-name\"><b>" + name + "</b></div>";
        var mp_html = "<div id=\"data-mp\">" + mp + "<div>";
        var count_html = "<span id=\"data-count\"><b>" + count + "</b></span>";
        if (name && mp && count) {
            $('#data_table').append(
                $('<tr></tr>').html(name_html + mp_html + count_html + " signatures")
            );
        }
    });
}

// draw our map on the SVG element
function draw(boundaries) {

    projection
        .scale(1)
        .translate([0,0]);

    // compute the correct bounds and scaling from the topoJSON
    var b = path.bounds(topojson.feature(boundaries, boundaries.objects[units]));
    var s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
    var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    projection
        .scale(s)
        .translate(t);

    // add an area for each feature in the topoJSON
    g.selectAll(".area")
        .data(topojson.feature(boundaries, boundaries.objects[units]).features)
        .enter().append("path")
        .attr("class", "area")
        .attr("id", function(d) {return d.id})
        .attr("d", path)
        .on("mouseenter", function(d){ return select(d)})
        .on("mouseleave", function(d){ return clear_info(d)});

    // add a boundary between areas
    g.append("path")
        .datum(topojson.mesh(boundaries, boundaries.objects[units], function(a, b){ return a !== b }))
        .attr('d', path)
        .attr('class', 'boundary');
}

// called to redraw the map - removes map completely and starts from scratch
function redraw() {
    compute_size();

    d3.select("svg").remove();

    init(width, height);
    draw(boundaries);
}

// loads data from the given file and redraws and recolours the map
function load_data(filename, u) {
    units = u;
    var f = filename;

    d3.json(f, function(error, b) {
        if (error) return console.error(error);
        boundaries = b;
        redraw();
        var petition_id = localStorage.getItem("petition_id")
        recolour_map(petition_id);
        display_petition_info(petition_id);
    });
}

function recolour_map(petition_id) {
    get_highest_count(petition_id);
}

function get_highest_count(petition_id) {
    var top_count = 0;
    var top_constituency;

    constituencies = current_petition.data.attributes.signatures_by_constituency;
    $.each(constituencies, function (index, item) {
        if (item.signature_count >= top_count) {
            top_count = item.signature_count;
            top_constituency = item.name;
        }
    });

    get_slices(top_count, petition_id);
}

function get_slices(top_count, petition_id) {
    var slice = top_count / 8;
    var slices = {};
    var current_slice = 0;
    for (i = 0; i <= 8; i++) {
        $('#t' + (i+1)).html("");
        if (i < 7 && i > 0) {
            $('#t' + (i+1)).html(Math.ceil(current_slice) + " - " +  Math.floor(current_slice + slice));
        } else if (i === 7) {
            $('#t' + (i+1)).html(Math.ceil(current_slice) + " +");
        } else {
            $('#t' + (i+1)).html("1 - " +  Math.floor(current_slice + slice));
        }
        slices[i] = current_slice;
        current_slice += slice;
    }
    colour_classes(slices, petition_id);
}

function colour_classes(slices, petition_id) {
    d3.selectAll(".coloured").attr("class", "area");

    constituencies = current_petition.data.attributes.signatures_by_constituency;
    $.each(constituencies, function (index, item) {
        var id = "#" + item.ons_code;
        var index = place_in_array(slices, item.signature_count);
        var colour_class = "c" + index + " coloured";
        d3.select(id)
            .attr("class", colour_class)
    });
}

function place_in_array(slices, count) {
    var slice = slices[1];
    for (i = 0; i < 8; i++) {
        if (count >= slices[i] && count < (slices[i] + slice)) {
            return i+1;
        } else if (count === (slices[1] * 8)) {
            return 8;
        }
    }
}

// when the window is resized, redraw the map
window.addEventListener('resize', redraw);
