import { ILayer }        from '../index'
import { D3UpdateLayer } from '../index'

export interface LabelLayerArgs
{
    data:     ()=> any,
    delta,
    transform,
    text,
    clip?:    string,
}

export class LabelLayer implements ILayer
{
    name = 'captions'
    args: LabelLayerArgs
    layer: D3UpdateLayer
    updateData =      ()=> this.layer.updateData()
    updateTransform = ()=> this.layer.updateTransform()
    updateColor =     ()=> this.layer.updateColor()

    constructor(args: LabelLayerArgs) {
        this.args = args
    }

    public attach(parent) {
        this.layer = new D3UpdateLayer({
            parent:            parent,
            clip:              this.args.clip,
            data:              this.args.data,
            name:              'captions',
            className:         'caption',
            elementType:       'text',
            create:            s=> s.classed("P",         d=> d.name == 'P')
                                    .classed("caption-icon", d=> d.icon && navigator.platform.includes('inux') ),
            updateColor:       s=> {},
            updateTransform:   s=> s.attr("transform",    d=> this.args.transform(d))
                                    .text(                this.args.text)
                                    .attr("dx",           (d, i, v)=> this.args.delta(d, i, v).re)
                                    .attr("dy",           (d, i, v)=> this.args.delta(d, i, v).im)
        })
    }
}



