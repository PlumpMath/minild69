define([], function () {
    "use strict";

    // http://stackoverflow.com/a/29332646/51280
    // D=100 : just return the bias
    // D=ε (not 0)  : return anything, seemingly unbiased
    // D=50 : return half possible values, biased - equal amounts either side.
    // D=25: return quarter possible values, biased.
    // D=75: return three quarters possible values, biased.
    function getRndBias(min, max, N, D) {
        D = D || 50;

        // Gaussian variables
        // the height of the curve's peak (we want [0,1.0) from Gaussian)
        var a = 1;
        var b = 50; // influence is up to 100, so the center is 50.
        // Gaussian bell width
        var c = D;

        // influence up to 100, since the Gaussian below will take it back
        // to the [0,1.0) range again.
        var influence = Math.floor(Math.random() * (101)),
            x = Math.floor(Math.random() * (max - min + 1)) + min;

        return x > N ? x + Math.floor(gauss(influence) * (N - x)) : x - Math.floor(gauss(influence) * (x - N));

        function gauss(x) {
            return a * Math.exp(-(x - b) * (x - b) / (2 * c * c));
        }
    }

    // procedurally generate the stencil index and width appropriate
    // for this level number.
    // Note how when the width increases, the easier stencils
    // get dished out again.
    function getStencilParameters(levelNumber, numOfStencils, baseWidth) {
        var stencilIndex = levelNumber % numOfStencils;
        // n*n stencil size
        var width = baseWidth +
                Math.floor(levelNumber / numOfStencils);

        return {
            width: width,
            idx: stencilIndex
        };
    }

    var logsliderCache = {};
    function lsKey(idx, max) {
        return 'ls' + idx + '-' + max;
    }
    // http://stackoverflow.com/a/846249/51280
    function logslider(idx, max) {
        var key = lsKey(idx, max);
        if (key in logsliderCache) {
            return logsliderCache[key];
        } else {
            // position will be between 0 and 5
            // HACK 5 because of 6 cube faces.
            var minp = 0;
            var maxp = 5;

            // The result should be between 1 an 200
            var minv = Math.log(1);
            var maxv = Math.log(max);

            // calculate adjustment factor
            var scale = (maxv - minv) / (maxp - minp);

            var result = Math.exp(minv + scale * (idx - minp));
            logsliderCache[key] = result;
            return result;
        }
    }

    return {
        rand: getRndBias,
        params: getStencilParameters,
        logslider: logslider
    };
});
