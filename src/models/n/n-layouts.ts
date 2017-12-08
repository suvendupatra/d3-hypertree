import { tree }                from 'd3-hierarchy'
import { N }                   from './n'
import {
    T, makeT, one,
    C, CktoCp, CptoCk,
    Cneg, CmulR, Clog, Cpow,
    h2e,
    πify, dfs, dfsFlat }       from '../../hyperbolic-math'

export type LayoutFunction = (root:N, t?:T) => N

var unitVectors = [{ re:1, im:0 }, { re:0, im:1 }, { re:-1, im:0 }, { re:0, im:-1 }]

export function layoutUnitVectors(root) {
    var some = [{ re:0, im:0 }].concat(unitVectors)
    var i=0
    dfs(root, n=> {
        var a = i%some.length
        n.z = { re:some[a].re*.99, im:some[a].im*.99 }
        i++
    })
    return root
}

export function layoutUnitLines(root) {
    root.z = { re:0, im:0 }
    for (var i=0; i<4; i++)
        layoutPath(root.children[i], unitVectors[i], root.children[i].height)

    function layoutPath(pathBegin, target, depth=30)
    {
        var i = 0
        var pa = 1/depth
        var rt = r=> pa + r * (1-pa)
        dfs(pathBegin, n=> {
            var r = i/depth
            n.z = { re:rt(r) * target.re, im:rt(r) * target.im }
            i++
        })
    }
    return root
}

export function layoutSpiral(root) {
    var flatNodes = dfsFlat(root)
    var nrN = flatNodes.length
    var nrRounds = Math.floor(nrN/24)
    for (var i=0; i < nrN; i++) {
        var a = i/nrN * 2*Math.PI * (nrRounds+1)
        var r = Math.pow(2, i/nrN)-1
        flatNodes[i].z = { re:r*Math.cos(a), im:r*Math.sin(a) }
    }
    return root
}

export function layoutBuchheim(root) {
    root = tree().size([2 * Math.PI, 0.9])(root)
    dfs(root, n=> {
        var a = n.x - Math.PI/2
        n.z = { re:n.y * Math.cos(a), im:n.y * Math.sin(a) }
    })
    return root
}

export function layoutLamping(n, wedge = { p:{ re:0, im:0 }, m:{ re:0, im:1 }, α:Math.PI }) {

    console.log('--------------------------------------------------------', n.depth)
    console.log(wedge.p, wedge.m, wedge.α)

    n.z = wedge.p

    if (n.children) {
        for (var i=0; i < n.children.length; i++) {

            var cα = wedge.α / n.children.length * (i+1)
            console.assert(isFinite(cα))
            console.log('cα', cα)

            var s = .1
            var it = ((1-s*s) * Math.sin(cα)) / (2*s);              console.log('it',it)
            var d = Math.sqrt(Math.pow(it,2)+1) - it
            d = d * .5

            console.assert(isFinite(d))
            console.log('d',d)

            var p1 = makeT(wedge.p, one)
            var np = h2e(p1, CmulR(wedge.m, d));                    console.log('np',np)

            var npp1 = makeT(Cneg(np), one)
            var nd1 = makeT({ re:-d, im:0 }, one)
            var nm = h2e(npp1, h2e(p1, wedge.m));                   console.log('nm',nm)
            var nα = Clog(h2e(nd1, Cpow(cα))).im;                   console.assert(isFinite(nα))

            layoutLamping(n.children[i], { p:np, m:nm, α:nα })
        }
    }
    return n
}

export function layoutBergé(n, t)
{
    var π = Math.PI    

    function wedgeTranslate(w, P)
    {
        var t = makeT(P, one)

        var pα = { re:Math.cos(w.α), im:Math.sin(w.α) }
        w.α = CktoCp(h2e(t, pα)).θ

        var pΩ = { re:Math.cos(w.Ω), im:Math.sin(w.Ω) }
        w.Ω = CktoCp(h2e(t, pΩ)).θ
    }

    function layoutNode(n:N, wedge:{α,Ω}, length)
    {
        if (n.parent)
        {
            var angleWidth = πify(wedge.Ω - wedge.α )
            var bisectionAngle = wedge.α + (angleWidth / 2.0)

            n.z = CptoCk({ θ:bisectionAngle, r:length })
            n.z = h2e(makeT(n.parent.z, one), n.z)

            wedgeTranslate(wedge, n.parent.z)
            wedgeTranslate(wedge, Cneg(n.z))
        }

        var angleWidth = πify(wedge.Ω - wedge.α )
        if (angleWidth > 2*π)
        {
            var anglediff = angleWidth - 2*π

            wedge.α += anglediff / 2.0
            wedge.α = πify(wedge.α)

            wedge.Ω -= anglediff / 2.0
            wedge.Ω = πify(wedge.Ω)

            angleWidth = 2*π
        }

        var currentAngle = wedge.α
        for (var c of n.children||[])
        {
            var α = currentAngle             //   +.5
            currentAngle += angleWidth * ((c.value||1) / (n.value||n.children.length||1))
            var Ω = πify(currentAngle)

            layoutNode(c, { α:α, Ω:Ω }, length)
        }
        return n
    }

    var startAngle    = 3 * π / 2
    var defAngleWidth = π * 1.999999999999
    var sad = 2.0
    var wedge = {
        α: πify(startAngle - defAngleWidth/sad),
        Ω: πify(startAngle + defAngleWidth/sad)
    }
    n.z = { re:0, im:0 }

    var λrNorm = πify(CktoCp(t.λ).θ) / 2 / Math.PI
    return layoutNode(n, wedge, λrNorm)
}