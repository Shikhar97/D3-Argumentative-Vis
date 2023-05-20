let data_file = "data/inc_occ_gender.csv";
let margin, width, height, opacity = 1;
let svg_left, svg_right, Tooltip;
let x, y;


document.addEventListener('DOMContentLoaded', function () {
    Promise.all([d3.csv(data_file)])
        .then(function (values) {
            console.log('loaded ' + data_file);

            margin = {top: 20, right: 80, bottom: 50, left: 60};
            width = 660 - margin.left - margin.right;
            height = 500 - margin.top - margin.bottom;

            labor_data = values[0];

            svg_left = d3.select("#stacked_bar_div")
                .append("svg")
                .attr("height", height + margin.top + margin.bottom)
                .attr("width", width + margin.left + margin.right)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            svg_right = d3.select("#scatter_div")
                .append("svg")
                .attr("height", height + margin.top + margin.bottom)
                .attr("width", width + margin.left + margin.right)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            svg_left.append("text")
                .attr("text-anchor", "center")
                .attr("id", "x1_axis_label")
                .attr("class", "fw-bold")
                .attr("x", width / 2 - 20)
                .attr("y", height + margin.top + 20)
                .style("font-size", 14)
                .text("Occupations");

            svg_left.append("text")
                .attr("id", "y1_axis_label")
                .attr("class", "fw-bold")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .attr("y", -margin.left + 15)
                .attr("x", -height / 2 + 50)
                .style("font-size", 14)
                .text("No. of workers");

            svg_right.append("text")
                .attr("text-anchor", "center")
                .attr("id", "x2_axis_label")
                .attr("class", "fw-bold")
                .attr("x", width / 2 - 20)
                .attr("y", height + margin.top + 20)
                .style("font-size", 14)
                .text("Occupations");

            svg_right.append("text")
                .attr("id", "y2_axis_label")
                .attr("class", "fw-bold")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .attr("y", -margin.left + 15)
                .attr("x", -height / 2 + 50)
                .style("font-size", 14)
                .text("Weekly Wage (USD)");

            Tooltip = d3.select("#stacked_bar_div")
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "2px")
                .style("border-radius", "5px")
                .style("padding", "10px")
                .style("width", "180px")
                .style("position", "absolute")
                .style("font-weight", "550")

            let female_data = getData();
            let female_occName = getOccName(female_data);

            drawStackedBarChart(female_data, female_occName);
            drawConnectedScatterPlot(female_data, female_occName);

        });
});

function getData() {

    let female_occ = [];
    labor_data.filter(function (d) {
        if (d["Occupation"] === d["Occupation"].toUpperCase()) {
            if (+d["M_workers"] < +d["F_workers"]) {
                female_occ.push(d);
            }
        }
    });
    return female_occ;
}

function getOccName(data) {
    return data.map(d => d["Occupation"])

}

function drawStackedBarChart(female_data, female_occName) {

    const subgroups = ["M_workers", "F_workers"];
    const groups = female_occName;
    let bar_map = {
        "F_workers": "Female",
        "M_workers": "Male"
    }
    const x = d3.scaleBand()
        .domain(female_occName)
        .range([0, width])
        .padding([0.2])

    const y = d3.scaleLinear()
        .domain([0, d3.max(female_data.map(d => +d["F_workers"])) + 2000])
        .range([height, 0]);

    var xSubgroup = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding([0.2])

    svg_left.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    svg_left.append("g")
        .call(d3.axisLeft(y));

    const color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(d3.schemeSet2);

    const stackedData = d3.stack()
        .keys(subgroups)
        (female_data)

    const mouseover = function (event, d) {
        Tooltip
            .style("opacity", 1)
    }
    const mousemove = function (event, d) {
        Tooltip
            .html(
                `<span>No. of workers: ${d.value}</span>`)
            .style("top", event.pageY - 300 + "px")
            .style("left", event.pageX + "px");
    }
    const mouseleave = function (event, d) {
        Tooltip
            .style("opacity", 0)
    }

    const s = 20
    svg_left.selectAll("my_rect")
        .data(subgroups)
        .join("rect")
        .attr("fill", function (d) {
            return color(d);
        })
        .attr("x", 520)
        .attr("y", (d, i) => 5 + i * (s + 5))
        .attr("width", 20)
        .attr("height", 20)

    svg_left.selectAll("my_labels")
        .data(subgroups)
        .enter()
        .append("text")
        .attr("x", 520 + s * 1.5)
        .attr("y", (d, i) => 5 + i * (s + 5) + (s / 2))
        .text(d => bar_map[d])
        .attr("text-anchor", "left")
        .style("fill", "black")
        .style("alignment-baseline", "middle")
        .style("font-size", "15px")
        .style("font-weight", "400");


    svg_left.append("g")
        .selectAll("g")
        .data(female_data)
        .enter()
        .append("g")
        .attr("transform", function (d) {
            return "translate(" + x(d["Occupation"]) + ",0)";
        })
        .selectAll("rect")
        .data(function (d) {
            return subgroups.map(function (key) {
                return {key: key, value: d[key]};
            });
        })
        .enter().append("rect")
        .attr("width", xSubgroup.bandwidth())
        .attr("x", function (d) {
            return xSubgroup(d.key);
        })
        .attr("y", function (d) {
            return y(0);
        })
        .attr("height", 0)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .transition()
        .duration(1000)
        .attr("y", function (d) {
            return y(d.value);
        })
        .attr("height", function (d) {
            return height - y(d.value);
        })
        .attr("stroke", "black")
        .attr("fill", function (d) {
            return color(d.key);
        });
}

function drawConnectedScatterPlot(female_data, female_occName) {
    const allGroup = ["M_weekly", "F_weekly"]
    let line_map = {
        "F_weekly": "Female",
        "M_weekly": "Male"
    }

    const dataReady = allGroup.map(function (grpName) {
        return {
            name: grpName,
            values: female_data.map(function (d) {
                return {Occupation: d["Occupation"], Wage: +d[grpName]};
            })
        };
    });

    const color = d3.scaleOrdinal()
        .domain(allGroup)
        .range(d3.schemeSet2);

    const x = d3.scaleBand()
        .domain(female_occName)
        .range([0, width]);

    svg_right.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    const y = d3.scaleLinear()
        .domain([400, d3.max(female_data.map(d => +d["M_weekly"])) + 100])
        .range([height, 0]);

    svg_right.append("g")
        .call(d3.axisLeft(y));

    const line = d3.line()
        .x(d => x(d.Occupation))
        .y(d => y(d.Wage))

    const mouseover = function (event, d) {
        Tooltip
            .style("opacity", 1)
    }
    const mousemove = function (event, d) {
        Tooltip
            .html(
                `<span>Weekly Wage: ${d.Wage}</span>`)
            .style("top", event.pageY - 300 + "px")
            .style("left", event.pageX  + "px");
    }
    const mouseleave = function (event, d) {
        Tooltip
            .style("opacity", 0)
    }

    let s = 20;
    svg_right.selectAll("my_rect")
        .data(allGroup)
        .join("rect")
        .attr("fill", function (d) {
            return color(d);
        })
        .attr("x", 520)
        .attr("y", (d, i) => 12 + i * (s + 5))
        .attr("width", 20)
        .attr("height", 2)

    svg_right.selectAll("my_labels")
        .data(allGroup)
        .enter()
        .append("text")
        .attr("x", 520 + s * 1.5)
        .attr("y", (d, i) => 5 + i * (s + 5) + (s / 2))
        .text(d => line_map[d])
        .attr("text-anchor", "left")
        .style("fill", "black")
        .style("alignment-baseline", "middle")
        .style("font-size", "15px")
        .style("font-weight", "400");


    let path = svg_right.selectAll("myLines")
        .data(dataReady)
        .join("path")
        .attr("transform", function (d) {
            return "translate(" + x(d.values[0].Occupation) + 35 + ",0)";
        })
        .attr("stroke", d => color(d.name))
        .style("stroke-width", 2)
        .style("fill", "none")
        .attr("d", d => line(d.values))

    path.transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attrTween("stroke-dasharray", function () {
            var length = this.getTotalLength();
            return function (t) {
                return (d3.interpolate("0," + length, length + ",0"))(t);
            };
        });


    svg_right
        .selectAll("myDots")
        .data(dataReady)
        .join('g')
        .attr("transform", function (d) {
            return "translate(" + x(d.values[0].Occupation) + 35 + ",0)";
        })
        .style("fill", d => color(d.name))
        .selectAll("myPoints")
        .data(d => d.values)
        .join("circle")
        .attr("class", "myPoints")
        .attr("cx", d => x(d.Occupation))
        .attr("cy", d => y(d.Wage))
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .transition()
        .duration(1500)
        .attr("r", 4)
        .attr("stroke", "white");

}
