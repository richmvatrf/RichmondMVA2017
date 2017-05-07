


d3.json("data/mva_data.geojson", function(data){
    
    //create chart variables
    var zaBar1 = dc.barChart("#Chart1"),
        zaBar2 = dc.barChart("#Chart2"),
        //zaBar3 = dc.barChart("#Chart3"),
        //zaBar4 = dc.barChart("#Chart4"),
        zaPie  = dc.pieChart("#pieChart"),
        zaMap  = dc.leafletChoroplethChart("#zaMap"),
        dataCount = dc.dataCount('#data-count'),
        dataTable = dc.dataTable('#data-table');
    
    //holder for the data
    var zaMapData = [];
    
    //color scale for the MVA
    var colorscale = d3.scale.ordinal()
        .domain(["A", "B", "C", "D", "E", "F", "G", "H", "I"])
        .range(["#9F87C7","#C0AAE6","#85ABE3", 
                "#A2C0EB","#FAFAB6","#FAED85", 
                "#FFCE7A","#EDBC66","#F7B99E",
                "#a59d9d","#a59d9d","#a59d9d"]);
    
    //extract the data we need for the dashboard
    for (var i = 0; i < data.features.length; i++){
        
        zaMapData.push({
            geo_id:         data["features"][i]["properties"]["geo_id"],
            hhdense:        data["features"][i]["properties"]["hhdense"],
            msp:            data["features"][i]["properties"]["mspall_1416"],
            clstr_final:    data["features"][i]["properties"]["clstr_final"],
            cnt: 1
        })
    };
            
    //normalize variables for histograms using set # of bins
    var Nbin = 25,                  
        msp_ext = d3.extent(zaMapData, function(d) {
            return +d.msp;
        }),             
        msp_w = Math.floor((msp_ext[1] - msp_ext[0]) / Nbin),
        
        hhd_ext = d3.extent(zaMapData, function(d){
            return +d.hhdense;
        }),
        hhd_w = Math.floor((hhd_ext[1] - hhd_ext[0]) / Nbin);
    
    //normalize the data
    _.each(zaMapData, function(d) {
        d.hhdense = +d.hhdense
        d.hhdense_n = Math.floor(+d.hhdense / hhd_w) * hhd_w
        d.msp = +d.msp
        d.msp_n = Math.floor(+d.msp / msp_w)*msp_w
        d.clstr_final = d.clstr_final
        
        //create numeric scale for MVA
        if (d.clstr_final == 'A') { 
           d.clstr_n =  1;
        } else if (d.clstr_final == 'B') { 
           d.clstr_n =  2;
        } else if (d.clstr_final == 'C') { 
           d.clstr_n =  3;
        } else if (d.clstr_final == 'D') { 
           d.clstr_n =  4;
        } else if (d.clstr_final == 'E') { 
           d.clstr_n =  5;
        } else if (d.clstr_final == 'F') { 
           d.clstr_n =  6;
        } else if (d.clstr_final == 'G') { 
           d.clstr_n =  7;
        } else if (d.clstr_final == 'H') { 
           d.clstr_n =  8;
        } else if (d.clstr_final == 'I') { 
           d.clstr_n =  9;
        } else { 
           d.clstr_n =  10;
        };
            
    });
         
    //cross filter the data        
    var ndx = crossfilter(zaMapData),

        mvaDim = ndx.dimension(function(d) {
            return d.clstr_final;
        }),
        mvaGroup = mvaDim.group().reduceSum(function(d) {
            return d.cnt;
        }),

        geoDim = ndx.dimension(function(d){
            return d.geo_id;
        }),
        geoGroup = geoDim.group().reduceSum(function(d){
            return d.clstr_n;
        }),

        denseDim = ndx.dimension(function(d) {
            return d.hhdense_n;
        }),
        denseGroup = denseDim.group().reduceCount(function(d) {
            return d.hhdense_n;
        }),

        mspDim = ndx.dimension(function(d) {
            return d.msp_n;
        }),
        mspGroup = mspDim.group().reduceCount(function(d) {
            return d.msp_n;
        }),
    
        allDim = ndx.dimension(function(d) {return d;}),
        all = ndx.groupAll();
    
        zaPie.width(300)
            .height(300)
            .colors(colorscale)
            .dimension(mvaDim)
            .group(mvaGroup);

        zaBar1.width(375)
            .height(250)
            .dimension(denseDim)
            .group(denseGroup)
            .brushOn(true)
            .xUnits(function(){return Nbin;})
            .x(d3.scale.linear().domain([0, hhd_ext[1]]))
            .xAxisLabel("Housing Density, 14-15");

        zaBar2.width(375)
             .height(250)
             .dimension(mspDim)
             .group(mspGroup)
             .brushOn(true)
             .xUnits(function(){return Nbin;})
             .x(d3.scale.linear().domain([0,msp_ext[1]]).range(5))
             .xAxisLabel("Median Sales Prices, 14-15");  
        zaBar2.xAxis().ticks(4);
            
        zaMap.width(500)
            .height(500)
            .brushOn(true)
            .dimension(geoDim)
            .group(geoGroup)
            .geojson(data.features)
            .featureKeyAccessor(function(data) {
                return data.properties.geo_id;
                })
            .colors(d3.scale.quantize().range(
                    ["rgba(148, 149, 150, 0.28)",
                     "#9F87C7", "#C0AAE6", "#85ABE3", 
                     "#A2C0EB", "#FAFAB6", "#FAED85", 
                     "#FFCE7A", "#EDBC66", "#F7B99E", 
                     "rgba(148, 149, 150, 0.28)"])
                   )
            .colorDomain([0, 10])
            .colorCalculator(function (d) { return d ? zaMap.colors()(d.value) : '#dd1212'; })
            .center([39.0997, -94.5786])
            .zoom(10);
    
    dataTable
    .dimension(allDim)
    .group(function (d) { return 'dc.js insists on putting a row here so I remove it using JS'; })
    .size(1000)
    .columns([
      function (d) { return d.geo_id; },
      function (d) { return d.clstr_final; },
      function (d) { return d.msp; },
      function (d) { return d.hhdense; }
    ])
    .sortBy(dc.pluck('clstr_final'))
    .order(d3.ascending)
    .on('renderlet', function (table) {
      // each time table is rendered remove nasty extra row dc.js insists on adding
      table.select('tr.dc-table-group').remove();
    })
    
    dataCount
      .dimension(ndx)
      .group(all);
        
    d3.selectAll('a#all').on('click', function () {
        dc.filterAll();
        dc.redrawAll();
        dc.renderAll();
    });
    
        dc.renderAll();
            
            
});
        

        
        