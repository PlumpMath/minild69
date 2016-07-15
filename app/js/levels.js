define(['logic'], function (logic) {

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

        return x > N
            ? x + Math.floor(gauss(influence) * (N - x))
            : x - Math.floor(gauss(influence) * (x - N));

        function gauss(x) {
            return a * Math.exp(-(x - b) * (x - b) / (2 * c * c));
        }
    }

    // quick test
    if (false) {
        var N = 8;
        _.times(N, function (i) {
            var x = _.times(5000, function(o) { return getRndBias(0,N,i, 25); });
            var y = _.groupBy(x);
            var max = {idx:0, val:0};
            for (var key in y) {
                if (y[key].length > max.val) {
                    max = {
                        idx: parseInt(key),
                        val: y[key].length
                    };
                }
            }
            var flag = max.idx !== i ? "X" : '';
            console.log(flag, i, y[i].length, max, y);
        });
    }


    // our planet is a cube, hence 6 faces, hence 6 stencils required.
    // difficulty can increase along these axes:
    // - levelNumber
    // - stencil difficulty
    // - stencil size (once the size increases, use the easier stencils again)
    // - stencil rotation (this can be binary random, i.e. rotate or not)
    function getStencils(levelNumber, levelConfig) {
        // n*n stencil size
        var stencilWidth = Math.floor((levelNumber / levelConfig.threshold) + levelConfig.initStencilWidth);

        var stencils = [];
        var stencilsUsed = [];
        var stencilIndices = [];
        var numberOfAvailableStencils = logic.stencils.length;
        var levelCycle = (levelNumber % numberOfAvailableStencils) - 1;
        while (stencils.length < 6) {
            // for each level up to the number of stencils available, bias
            // towards the level number, then cycle
            var randomStencilIndex = getRndBias(
                0,
                numberOfAvailableStencils,
                levelCycle);

            // if we're about to pick the last stencil, but the second-last
            // stencil was 'all', just add 'all' again.
            if (stencils.length == 5 && stencilsUsed[4] === 'all') {
                randomStencilIndex = 0;
            }

            stencilIndices.push(randomStencilIndex);
            var stencilObj = logic.stencils[randomStencilIndex];

            stencilsUsed.push(stencilObj.name);
            var stencil = logic.faces.init(stencilWidth, stencilObj.fn);
            stencils.push(stencil);

            // unless this stencil is 'all', also add its inverse.
            // (this means a level can be perfectly completed)
            if (stencilObj.name !== 'all') {
                var inverse = logic.faces.toggle(stencil);
                stencilsUsed.push(stencilObj.name + '.inv');
                stencils.push(inverse);
            }
        }

        // most of the below is for debugging, and the caller will mostly
        // be interested in 'stencils'
        return {
            stencilWidth: stencilWidth,
            stencils: stencils,
            noOfStencilsAvailable: numberOfAvailableStencils,
            stencilIndices: stencilIndices,
            stencilsUsed: _.join(stencilsUsed, ',')
        };
    }

    var level = function(levelNumber, world) {
        console.log('logic', logic);
        console.log('world', world);

        // get stencils
        var stencils = getStencils(levelNumber, world.config.level);
        console.log(stencils);

        var planes = _.map(stencils.stencils, function (stencil, idx) {
            var plane = getPlaneFromStencil(idx, stencil, world.config.width);
            world.props.container.add(plane);
            return plane;
        });

        return planes;
    };

    // reusable materials
    var visibleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide} );
    var invisibleMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide
    });
    var materials = [
        visibleMaterial,
        invisibleMaterial
    ];

    function logslider(idx) {
        // position will be between 0 and 5
        var minp = 0;
        var maxp = 5;

        // The result should be between 1 an 200
        var minv = Math.log(1);
        var maxv = Math.log(300);

        // calculate adjustment factor
        var scale = (maxv-minv) / (maxp-minp);

        return Math.exp(minv + scale*(idx-minp));
    }

    // quick test
    if (false) {
        _.times(6, function (idx) {
            console.log(idx, logslider(idx));
        });
    }

    function getPlaneFromStencil(idx, stencil, width) {
        // draw a plane based on stencil
        var geometry = new THREE.PlaneGeometry(
            width,
            width,
            stencil.length,
            stencil.length);

        var plane = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
        plane.position.set(0, 0, (300 - logslider(idx)) + width * 2);

        // faces are triangles, but we want squares (i.e. pairs of triangles)
        var squareCount = geometry.faces.length / 2;

        // flatten the stencil from 2-dim array so we can easily index it.
        var flatStencil = _.flatten(stencil);
        for (var i=0; i<squareCount; i++) {
            var j = i * 2;
            geometry.faces[j].materialIndex = flatStencil[i] ? 0 : 1;
            geometry.faces[j + 1].materialIndex = flatStencil[i] ? 0 : 1;
        }

        return plane;
    }

    return {
        getLevel: level
    };
});
