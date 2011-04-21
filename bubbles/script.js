// Copyright (c) 2011, Centrum Cyfrowe
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//   * Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//   * Neither the name of the Centrum Cyfrowe nor the names of its contributors
//     may be used to endorse or promote products derived from this software
//     without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
// OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

(function () {
    var i;
    var height = 350;
    var width = 900;
    var circles = [];
    var paper = Raphael( 'notepad', width, height );
    var bread_crumb = [];

    create_table();
    make_bubbles( paper, get_data( budget ), 'v_total', [ width, 30, height ] );

    // G E T   D A T A
    function get_data( source, parent ) {
        var parent = parent || null;

        return Tools.filter( function ( element ) {
            return element['parent'] === parent;
        }, source );
    }

    // R E D R A W
    function redraw( parent ) {
        var geometry = [ width, 30, height ];

        paper.clear();
        make_bubbles( paper, get_data( budget, parent ), 'v_total', geometry );
    }

    // M A K E   B U B B L E S
    function make_bubbles( canvas, data, key, geometry ) {
        var raw_data = data;
        var data = Tools.normalize_data( raw_data, key );
        var width = geometry[0] || 900;
        var offset = geometry[1] || 0;
        var height = geometry[2] || 600;
        var ratio = 0;
        var radii = [];
        var max_radius = 0.0;
        var min_radius = 2.0;
        var max_line, min_line;
        var modifier;
        var vis_objects = [];
        var x, y;
        var ball_color = "#5ab5ff";
        var handle_color = "#aaa";
        var handle_over_color = "#666";

        // white background
        canvas
            .rect( 1, 1, width-2, height-2 )
            .attr({
                fill: "#fff",
                stroke: "#eee"
            });

        // fill the radii array and find max/min values
        for( i = 0; i < data.length; ++i ) {
            radii.push( Math.sqrt( data[i] / Math.PI ));
            max_radius = max_radius < radii[i] ? radii[i] : max_radius;
            min_radius = min_radius > radii[i] ? radii[i] : min_radius;
        }

        // find a proper ratio for the balls size
        ratio = ( width - offset ) / ( Tools.get_sum(radii) * 2 );
        if( max_radius * ratio > 100 ) {
            ratio = 100 / max_radius;
        }

        // initialize offset to center the visualization
        offset = width / 2;
        for( i = 0; i < radii.length; ++i ) {
            offset -= radii[i] * ratio;
        }


        // M A I N   V I S U A L I Z A T I O N   L O O P
        for( i = 0; i < data.length; ++i ) {
            // ball geometry
            radius = radii[i] * ratio;
            x = offset + radius;
            y = height / 2;

            // odd/even
            modifier = (i % 2 == 0) ? 0 : 10;

            // vis object
            vis_objects.push({
                graph: canvas.set(),
                x: x,
                y: y,
                label: null,
                name: raw_data[i]['name'],
                value: raw_data[i]['v_total'],
                leaf: raw_data[i]['leaf'],
                idef: raw_data[i]['idef']
            });

            // vis graph
            vis_objects[i]['graph']
                .push(
                    // [0] main circle
                    canvas
                        .circle( x, y, radius )
                        .attr({
                            fill: ball_color,
                            stroke: "none",
                        }),
                    // [1] axis
                    canvas
                        .path( "M "+ x +" "+ (y + radius + 5) +
                              " L "+ x +" "+ (height * 0.85 + modifier) +
                              " M "+ x +" "+ (y - radius - 5) +
                              " L "+ x +" "+ (height * 0.125) )
                        .attr({
                            stroke: handle_color
                        }),
                    // [2] handle
                    canvas
                        .rect( x - 3, height * 0.85 + modifier - 3, 6, 6 )
                        .attr({
                            fill: handle_color,
                            stroke: "none"
                        }),
                    // [3] index number
                    canvas
                        .text( x, height * 0.85 + modifier + 16, (i+1) )
                        .attr({
                            fill: handle_color,
                        })
                );

            (function ( vis_object ) {
                var name = vis_object['name'];
                var text_len = name.length * 3;
                var x = vis_object['x'];

                vis_object['graph']
                    .mouseover( function (event) {
                        vis_object['label'] = canvas
                            .text( x, height * 0.075,
                                   Tools.toTitleCase( vis_object['name'] ) +
                                   "\n" +
                                   Tools.money( vis_object['value']) )
                            .attr({
                                "font-size": "12px"
                            })

                        if( x < 150 || x < text_len ) {
                            vis_object['label'].attr({ "text-anchor": "start" });
                        }
                        else if( x > width - 150 ){
                            vis_object['label'].attr({ "text-anchor": "end" });
                        }

                        if( vis_object['leaf'] !== true ) {
                            vis_object['graph'].attr({
                                cursor: "pointer"
                            });
                            vis_object['graph'][0].attr({
                                fill: "#9bd2ff"
                            });
                        }
                        vis_object['graph'][1].attr({
                            stroke: handle_over_color
                        });
                        vis_object['graph'][2].attr({
                            stroke: handle_over_color,
                            fill: handle_over_color
                        });
                        vis_object['graph'][3].attr({
                            fill: handle_over_color
                        });
                    })
                    .mouseout( function (event) {
                        vis_object['graph'][0].attr({
                            fill: ball_color
                        });
                        vis_object['graph'][1].attr({
                            stroke: handle_color
                        });
                        vis_object['graph'][2].attr({
                            stroke: "none",
                            fill: handle_color
                        });
                        vis_object['graph'][3].attr({
                            fill: handle_color
                        });
                        vis_object['label'].remove();
                    })
                    .click( function (event) {
                        if( vis_object['leaf'] !== true ) {
                            redraw( vis_object['idef'] );
                        }
                    });

            })( vis_objects[i], x );

            offset += ( radius * 2 ) ;
        }


        // B R E A D   C R U M B
        var parent_id = raw_data[0]['parent'];
        var parent_parent_id = null;
        var parent_name;
        if( parent_id !== null ) {
            var parents = Tools.filter( function (element) {
                return element['idef'] === raw_data[0]['parent'];
            }, budget );
            parent_name = parents[0]['name'];
            parent_parent_id = parents[0]['parent'];
        }
        else {
            parent_name = "Budżet zadaniowy";
        }

        update_bread_crumb({
            name: Tools.toTitleCase( parent_name ),
            idef: parent_id
        });
        draw_bread_crumb( bread_crumb );
        update_table( raw_data );
        return circles;
    }


    function update_bread_crumb( new_crumb ) {
        var i;
        var found = false;

        // remove unuseful crumbs
        for( i = 0; i < bread_crumb.length; ++i ) {
            if( bread_crumb[i]['idef'] === new_crumb['idef'] ) {
                bread_crumb = bread_crumb.slice( 0, i+1 );
                found = true;
                break;
            }
        }

        // or add a new crumb
        if( found === false ) {
            bread_crumb.push( new_crumb );
        }
    }


    function draw_bread_crumb( bread_crumb ) {
        var html = [];
        var i;

        for( i = 0; i < bread_crumb.length; ++i ) {
            // add an active crumb number one
            if( bread_crumb.length > 1 && i === 0 ) {
                html.push( '<div id="', bread_crumb[i]['idef'], '">' );
                html.push( bread_crumb[i]['name'] );
                html.push( '</div>' );
            }
            // or some inactive brumb
            else if( i === bread_crumb.length - 1 ) {
                // if the last one
                if( i !== 0 ) {
                    html.push( '<span class="more"> > </span>' );
                }

                html.push( '<div id="', bread_crumb[i]['idef'] );
                html.push( '" class="inactive">' );
                html.push( bread_crumb[i]['name'] );
                html.push( '</div>' );
            }
            // or finally all the normal crumbs go here
            else {
                html.push( '<span class="more"> > </span>' );
                html.push( '<div id="', bread_crumb[i]['idef'], '">' );
                html.push( bread_crumb[i]['name'] );
                html.push( '</div>' );
            }
        }

        // clear and container and append a newly cereated bread crumb
        $('#bread-crumb').html('');
        $('#bread-crumb').append( $( html.join('') ));

        // event listener redrawing the visualization
        $('#bread-crumb > div').click( function() {
            redraw( $(this).attr('id') );
        });
    }


    function create_table() {
        // create a header with empty table body
        var html = [ '<table><thead><tr>' ];
        html.push( '<td class="idef">Lp.</td>' );
        html.push( '<td class="type">Typ</td>' );
        html.push( '<td class="name">Nazwa</td>' );
        html.push( '<td class="eu value">Środki europejskie</td>' );
        html.push( '<td class="pl value">Środki własne RP</td>' );
        html.push( '<td class="total value">Suma</td>' );
        html.push( '</tr></thead><tbody></tbody></table>' );

        $('#table').append( $( html.join('') ));
    }


    function update_table( data ) {
        var html = [];
        var i = 0;

        for( i = 0; i < data.length; ++i ) {
            html.push( '<tr class="', (i % 2 === 0 ? 'even' : 'odd'), '">' );
            html.push( '<td class="idef">', (i+1) ,'.</td>' );

            html.push( '<td class="type">' );
            html.push( Tools.toTitleCase(data[i]['type']) ,'</td>' );

            html.push( '<td class="name">' );
            html.push( Tools.toTitleCase(data[i]['name']) ,'</td>' );

            html.push( '<td class="eu value">' );
            html.push( Tools.money(data[i]['v_eu']) ,'</td>' );

            html.push( '<td class="pl value">' );
            html.push( Tools.money(data[i]['v_nation']) ,'</td>' );

            html.push( '<td class="total value">' );
            html.push( Tools.money(data[i]['v_total']) ,'</td>' );
            html.push( '</tr>' );
        }

        // clear and container and append a new table body
        $('tbody').html('');
        $('tbody').append( $( html.join('') ));
    }
})();
