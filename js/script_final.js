// Define an svg for the charts.
var svg = dimple.newSvg('#chartContainer', 1000, 500);
// Load in the dataset
d3.csv('data/dep_delay.csv', function(data) {
  // Filter the data by the Month.
  data = dimple.filterData(data, 'Month', [
    'Jan-08', 'Feb-08', 'Mar-08', 'Apr-08', 'May-08', 'Jun-08',
    'Jul-08', 'Aug-08', 'Sep-08', 'Oct-08', 'Nov-08', 'Dec-08'
  ]);
  // Define a color set from colorbrewer.
  colors = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c',
    '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a'
  ];
  // Create the month chart on the right of the main chart
  var indicator = new dimple.chart(svg, data);
  // Set the new default colors
  indicator.defaultColors = [
    new dimple.color(colors[0]),
    new dimple.color(colors[1]),
    new dimple.color(colors[2]),
    new dimple.color(colors[3]),
    new dimple.color(colors[4]),
    new dimple.color(colors[5]),
    new dimple.color(colors[6]),
    new dimple.color(colors[7]),
    new dimple.color(colors[8]),
    new dimple.color(colors[9])
  ];
  // Pick blue as the default and orange for the selected month
  var defaultColor = indicator.defaultColors[1];
  var indicatorColor = indicator.defaultColors[7];

  // The frame duration for the animation in milliseconds
  var frame = 2000;

  var firstTick = true;

  // Place the indicator bar chart to the right
  indicator.setBounds(550, 50, 400, 400);

  // Add dates along the y axis
  var y = indicator.addCategoryAxis('y', 'Month');
  y.addOrderRule('Month', true);

  // Use sales for bar size
  var x = indicator.addMeasureAxis('x', 'Total National Average Departure Delay');

  // Add the bars to the indicator and add event handlers
  var s = indicator.addSeries(null, dimple.plot.bar);
  s.addEventHandler('click', onClick);
  // Draw the side chart
  indicator.draw();

  // Remove the title from the y axis
  y.titleShape.remove();

  // Remove the lines from the y axis
  y.shapes.selectAll('line,path').remove();

  // Move the y axis text inside the plot area
  y.shapes.selectAll('text')
    .style('text-anchor', 'start')
    .style('font-size', '11px')
    .attr('transform', 'translate(18, 0.5)');

  // This block simply adds the legend title.
  svg.selectAll('right_title_text')
    .data(['Click bar to select and pause. Click again to resume animation'])
    .enter()
    .append('text')
    .attr('x', 600)
    .attr('y', function(d, i) {
      return 20 + i * 12;
    })
    .style('font-family', 'sans-serif')
    .style('font-size', '12px')
    .style('color', 'Black')
    .text(function(d) {
      return d;
    });

  // Manually set the bar colors so that Jan-08 is orange
  s.shapes
    .attr('rx', 10)
    .attr('ry', 10)
    .style('fill', function(d) {
      return (d.y === 'Jan-08' ? indicatorColor.fill : defaultColor.fill);
    })
    .style('stroke', function(d) {
      return (d.y === 'Jan-08' ? indicatorColor.stroke : defaultColor.stroke);
    })
    .style('opacity', 0.45);

  // Draw the scatter chart
  var bubbles = new dimple.chart(svg, data);
  bubbles.setBounds(100, 50, 400, 400);
  var bx = bubbles.addMeasureAxis('x', 'Total Number of Flights');
  //fix the axes
  bx.overrideMin = 0;
  bx.overrideMax = 6500;
  var by = bubbles.addMeasureAxis('y', 'Average Depature Delay');
  by.overrideMin = 0;
  by.overrideMax = 35;
  // add the airports
  bubbles.addSeries(['Origin'], dimple.plot.bubble);
  //create a legend
  var mylegend = bubbles.addLegend(0, 150, 40, 200);
  // use the same colors
  bubbles.defaultColors = [
    new dimple.color(colors[0]),
    new dimple.color(colors[1]),
    new dimple.color(colors[2]),
    new dimple.color(colors[3]),
    new dimple.color(colors[4]),
    new dimple.color(colors[5]),
    new dimple.color(colors[6]),
    new dimple.color(colors[7]),
    new dimple.color(colors[8]),
    new dimple.color(colors[9])
  ];
  // Add a storyboard to the main chart and set the tick event
  var story = bubbles.setStoryboard('Month', onTick);
  // Change the frame duration
  story.frameDuration = frame;
  // Order the storyboard by Month
  story.addOrderRule('Month');

  // Draw the bubble chart
  bubbles.draw();

  // Orphan the legends as they are consistent but by default they
  // will refresh on tick
  bubbles.legends = [];

  // Remove the storyboard label because the chart will indicate the
  // current month instead of the label
  story.storyLabel.remove();

  svg.selectAll('left_title_text')
    .data(['Click legend to show/hide Airports:'])
    .enter()
    .append('text')
    .attr('x', 200)
    .attr('y', function(d, i) {
      return 20 + i * 12;
    })
    .style('font-family', 'sans-serif')
    .style('font-size', '12px')
    .style('color', 'Black')
    .text(function(d) {
      return d;
    });

  // Legend controls
  // Get a unique list of Origin values to use when filtering
  var filterValues = dimple.getUniqueValues(data, 'Origin');
  // Get all the rectangles from our now orphaned legend
  mylegend.shapes.selectAll('rect')
    // Add a click event to each rectangle
    .on('click', function(e) {
      // This indicates whether the item is already visible or not
      var hide = false;
      var newFilters = [];
      // If the filters contain the clicked shape hide it
      filterValues.forEach(function(f) {
        if (f === e.aggField.slice(-1)[0]) {
          hide = true;
        } else {
          newFilters.push(f);
        }
      });
      // Hide the shape or show it
      if (hide) {
        d3.select(this).style('opacity', 0.2);
      } else {
        newFilters.push(e.aggField.slice(-1)[0]);
        d3.select(this).style('opacity', 0.8);
      }
      // Update the filters
      filterValues = newFilters;
      // Filter the data
      bubbles.data = dimple.filterData(data, 'Origin', filterValues);
      // Passing a duration parameter makes the chart animate. Without
      // it there is no transition
      bubbles.draw(800);
    });

  // Bar Chart Month Controls
  // On click of the side chart
  function onClick(e) {
    // Pause the animation
    story.pauseAnimation();
    // If it is already selected resume the animation
    // otherwise pause and move to the selected month
    if (e.yValue === story.getFrameValue()) {
      story.startAnimation();
    } else {
      story.goToFrame(e.yValue);
      story.pauseAnimation();
    }
  }

  // On tick of the main charts storyboard
  function onTick(e) {
    if (!firstTick) {
      // Color all shapes the same
      s.shapes
        .transition()
        .duration(frame / 2)
        .style('fill', function(d) {
          return (d.y === e ? indicatorColor.fill : defaultColor.fill);
        })
        .style('stroke', function(d) {
          return (d.y === e ? indicatorColor.stroke : defaultColor.stroke);
        });
    }
    firstTick = false;
  }
});
