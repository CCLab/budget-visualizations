(function () {
    var i;

    var width = 900, height = 400;

    var administers, data_length;
    var step, previous, cdf;
    var current_cdf, next_cdf;
    var threshold;
    var graph;
    var cx, cy, nx, ny;

    var offset;
    var paper;

    data_length = data.length;
    data.sort( function( a, b ) {
        return a - b;
    });

    // create cdf objects
    previous = data[0];
    step = 0;
    cdf = [];
    for( i = 0; i <= data_length; ++i ) {
        step += 1 / data_length;

        if( data[i] !== previous ) {
            cdf.push({
                step: step - ( 1 / data_length ),
                value: data[i-1], 
            });
        }
    }

    // prepare the paper for the graph
    paper = Raphael( 'notepad', width, height );
    paper.rect( 0, 0, width, height );

    // main drawing loop
    graph = "M ";
    threshold = 0.9;
    for( i = 0; i < cdf.length - 1; ++i ) {
        current_cdf = Tools.remap( cdf[i]['value'],
                                   data[0], data[data_length-1], 
                                   0.1, 1.0 );
        
        next_cdf = Tools.remap( cdf[i+1]['value'],
                                data[0], data[data_length-1],
                                0.1, 1.0 );
        
        cy = height * ( Math.abs( Tools.log10( current_cdf )));
        cx = cdf[i]['step'] * width;
        ny = height * ( Math.abs( Tools.log10( next_cdf )));
        nx = cdf[i+1]['step'] * width;

        graph += cx +" "+ cy +" L "+ nx +" "+ ny;

        // add new graph segment
        if( i < cdf.length - 2 ) {
            graph += " L ";
        }
        // or draw the graph finally
        else {
            paper
                .path( graph )
                .attr({
                    stroke: "#0089cf",
                    "stroke-width": "3px"
                });
        }
        
        // print some labels on the y-axis
        if( cdf[i]['step'] > threshold || cdf[i]['value'] > 7000000) {
            paper
                .text( 0, cy, Tools.money( cdf[i]['value']) )
                .attr({
                    "text-anchor": "start"
                });
            paper
                .path( "M 0 "+ cy +" L "+ width +" "+ cy )
                .attr({
                    stroke: "#ccc"
                });
            threshold += 0.01;
        }
    }

    // x-axis labels
    for( i = 0; i <= 1; i += 0.05 ) {
        offset = width * i;
        paper
            .text( offset, height-10, Math.round(i*100)+"%" )
            .attr({
                "text-anchor": "middle"
            });

        paper
            .path( "M "+ offset +" 0 L "+ offset +" "+ height )
            .attr({
                stroke: "#ccc"
            });
    }
})();