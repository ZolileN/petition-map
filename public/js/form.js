var current_petition;
var mp_data;
var ui_hidden = false;

// Options for loading spinner
var opts = {
    lines: 13,
    length: 28,
    width: 14,
    radius: 42,
    scale: 0.5,
    corners: 1,
    color: '#000',
    opacity: 0.25,
    rotate: 0,
    direction: 1,
    speed: 1,
    trail: 60,
    fps: 20,
    zIndex: 2e9,
    className: 'spinner',
    top: '50%',
    left: '50%',
    shadow: false,
    hwaccel: false
}

// Start spinner and attach to target
var target = document.getElementById('spinner_area')
var spinner = new Spinner(opts).spin(target);

// On start load the petition data
$(document).ready(function() {
    $.getJSON("https://petition.parliament.uk/petitions.json?state=open", function (data) {
        petitions = data.data;
        $.each(petitions, function (index, item) {
            var dropdown_text = item.attributes.action;
            $('#petition_dropdown').append(
                $('<option></option>').val(item.id).html(dropdown_text)
            );
            $('#petition_dropdown_mobile').append(
                $('<option></option>').val(item.id).html(dropdown_text)
            );
        });

        load_mp_data();

        // Initialise the petition dropdown to use select2
        $("#petition_dropdown").select2();

        load_petition(get_petition_id(), false);
    });
});


// Get petition id to load
function get_petition_id() {
    var petition_id;

    // Check if mobile or desktop interface
    if ($(window).width() > 720) {
        console.log("desktop")
        petition_id = $("#petition_dropdown").val();
    } else {
        console.log("mobile");
        petition_id = $("#petition_dropdown_mobile").val();
    }

    // Get variables from url
    var variables = get_url_variables();

    if (!jQuery.isEmptyObject(variables)) {
        petition_id = variables.petition;
        $("input[name='area'][value=" + variables.area + "]").prop("checked",true);
    }

    return petition_id;
}

// Extracts variables from url
function get_url_variables() {
    var variables = {}, hash;
    var hashes = window.location.href
                    .slice(window.location.href.indexOf('?') + 1)
                    .split('&');

    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        variables[hash[0]] = hash[1];
    }

    if (!hash[1]) {
        variables = {};
    }

    return variables;
}

// Get link for specific petition and area
function get_link() {
    var root_url = window.location.origin;
    var petition = current_petition.data.id;
    var area = $("input[name='area']:checked").val();
    var link = root_url + "/?" + "petition=" + petition + "&area=" + area;
    return link;
}


// Loads MP JSON data and fills constituency dropdown
function load_mp_data() {
    $.getJSON("json/mps/constituency_party_ons.json", function (data) {
        mp_data = data;
        $.each(mp_data, function (index, item) {
            var dropdown_text = item.constituency;
            $('#constituency').append(
                $('<option></option>').val(index).html(dropdown_text)
            );
        });

        // Initialise the constituency dropdown to use select2
        $("#constituency").select2();
    });
}

// Loads petition from UK Government Petition site
function load_petition(petition_id, is_url) {
    var petition;

    // Check if url is supplied, otherwise create url
    if (is_url) {
        petition = petition_id;
    } else {
        petition = "https://petition.parliament.uk/petitions/" + petition_id;
    }

    $.getJSON(petition + ".json", function (data) {
        current_petition = data;
        display_petition_info(petition_id);
        reload_map();
    })
    .fail(function() {
        alert("Petition not found!");
    });
}

// Display petition info in panel
function display_petition_info() {
    $('#hide_petition_info').prop('checked', false);

    $('#petition_info').hide();
    $('#petition_info').empty();
    $('#petition_info').append('<table></table>');

    var count = number_with_commas(current_petition.data.attributes.signature_count);

    var sign_link = "https://petition.parliament.uk/petitions/" + current_petition.data.id + "/signatures/new";
    var count_html = "<span id=\"data_count\">" + count + "</span>";
    var sign_html = "<a class=\"flat_button sign\" href='" + sign_link + "'><i class=\"fa fa-pencil\"></i> Sign Petition</a>";

    $('#petition_info').append(
        $('<tr></tr>').html("<div id=\"petition_action\">" + current_petition.data.attributes.action + "<div>")
    );

    if ($(window).width() > 720) {
        $('#petition_info').append(
            $('<tr></tr>').html("</br>" + current_petition.data.attributes.background + "</br>")
        );
    }

    $('#petition_info').append(
        $('<tr></tr>').html("</br><div>" + count_html + " <span id=\"signatures\">signatures</span></div>")
    );
    $('#petition_info').append(
        $('<tr></tr>').html("</br>" + sign_html)
    );
    $('#petition_info').show();
}

// Reset zoom and reload map with new area
function change_area() {
    reset();
    reload_map();
}


// Reload map
function reload_map() {
    var units = "wpc";

    var area = $("input[name='area']:checked").val();

    if ($(window).width() < 720) {
        area = $("#area_dropdown").val();
    }

    var f = 'json/uk/' + area + '/topo_' + units + '.json';
    load_data(f, units);
}


////////////////////////////////////////////////////////////////////////////////


// Area selection (mobile)
$("#area_dropdown").on('change', function() {
    spinner.spin(target);

    units = "wpc";

    var area = $("#area_dropdown").val()
    console.log(area);

    var f = 'json/uk/' + area + '/topo_' + units + '.json';
    load_data(f, units);
});


// Petition selection (desktop)
$("#petition_dropdown").on('change', function() {
    spinner.spin(target);

    var petition_id = $("#petition_dropdown").val()

    load_petition(petition_id, false);
});

// Petition selection (mobile)
$("#petition_dropdown_mobile").on('change', function() {
    spinner.spin(target);

    var petition_id = $("#petition_dropdown_mobile").val()

    load_petition(petition_id, false);
});

// Constituency selection (desktop only)
$("#constituency").on('change', function() {
    var ons_code = $("#constituency").val()

    var constituency_data = {
        "id": ons_code
    }

    select(constituency_data);
});

// Button to hide petition info (desktop)
$("#hide_petition_info").click(function(){
    if($(this).prop("checked") == true){
        $('#petition_info').fadeOut();
    }
    else if($(this).prop("checked") == false){
        $('#petition_info').fadeIn();
    }
});

// Button to hide map key (desktop)
$("#hide_map_key").click(function(){
    if($(this).prop("checked") == true){
        $('#key').fadeOut();
    }
    else if($(this).prop("checked") == false){
        $('#key').fadeIn();
    }
});


// Create & open sharing modal (desktop)
$('#petition_get_link').click(function() {
    var link = get_link();

    $('#petition_link').val(link);
    $('#petition_link').focus().select();

    // Clone modal
    var modal = $("#modal").clone();

    // Open modal
    vex.dialog.open({
        message: $(modal).show(),
        buttons:
        [$.extend({}, vex.dialog.buttons.NO, { text: 'Close' })],
    });
});


// Create & open sharing modal (mobile)
$('#mobile_share').click(function() {
    var link = get_link();

    $('#petition_link').val(link);

    // Clone modal
    var modal = $("#modal").clone();

    // Open modal
    vex.dialog.open({
        message: $(modal).show(),
        buttons:
        [$.extend({}, vex.dialog.buttons.NO, { text: 'Close' })],
    });
});

// Button to hide UI (mobile)
$('#hide_ui').click(function() {
    if (ui_hidden) {
        $('#petition_info').fadeIn();
        $('#key').fadeIn();
        $('#hide_ui').html("Hide UI");
        ui_hidden = false;
    } else {
        $('#petition_info').fadeOut();
        $('#key').fadeOut();
        $('#hide_ui').html("Show UI");
        ui_hidden = true;
    }
});

// Button to enter custom petition url
$('#petition_button').on('click', function() {
    petition_url = $('#petition_url').val();

    load_petition(petition_url, true);

    recolour_map();
});


// Lock screen to portrait on mobile
var previousOrientation = window.orientation;
var check_orientation = function(){
    if(window.orientation !== previousOrientation){
        previousOrientation = window.orientation;

        if (window.orientation !== 0) {
            $("#support").fadeIn();
            setTimeout(function () {
                alert("Landscape mode is not supported on mobile devices")
            }, 1000);
        } else {
            $("#support").fadeOut();
        }
    }
};

window.addEventListener("resize", check_orientation, false);
window.addEventListener("orientationchange", check_orientation, false);

