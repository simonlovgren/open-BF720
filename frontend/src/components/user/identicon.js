import { throwStatement } from '@babel/types';
import React, { useEffect, useState } from 'react';
const seedrandom = require('seedrandom');

export class Identicon extends React.Component {
    constructor(props) {
        super(props);
        this.userid = props.userid;

        this.MAX_COLOR   = 255;                                         // Max value for a color component
        this.MIN_COLOR   = 120;                                           // Min value for a color component
        this.FILL_CHANCE = 0.5;                                         // Chance of a square being filled [0, 1]
        this.SQUARE      = 80;                                          // Size of a grid square in pixels
        this.GRID        = 7;                                           // Number of squares width and height
        this.PADDING     = this.SQUARE;                                 // Padding on the edge of the canvas in px
        this.SIZE        = this.SQUARE * this.GRID + this.PADDING * 2;  // Size of the canvas
        this.FILL_COLOR  = '#777';                                      // canvas background color
    }

    setupCanvas = (color) => {
        let canvas = document.createElement('canvas');
        canvas.width = this.SIZE;
        canvas.height = this.SIZE;

        // Fill canvas background
        let context = canvas.getContext('2d');
        context.beginPath();
        context.rect(0, 0, this.SIZE, this.SIZE);
        context.fillStyle = `#${color[0].toString(16)}${color[1].toString(16)}${color[2].toString(16)}`;
        context.fill();
        return canvas;
    }

    /* Fill in a square of the canvas */
    fillBlock = (x, y, color, context) => {
        context.beginPath();
        context.rect(this.PADDING + x * this.SQUARE, this.PADDING + y * this.SQUARE, this.SQUARE, this.SQUARE);
        context.fillStyle = 'rgb(' + color.join(',') + ')';
        context.fill();
    }

    /* Generate a random color with low saturation. */
    generateColor = (rng) => {
        let rgb = [ ];
        for (let i = 0; i < 3; i++) {
            let val = Math.floor(rng() * 256);
            let minEnforced = Math.max(this.MIN_COLOR, val);
            let maxEnforced = Math.min(this.MAX_COLOR, minEnforced);
            rgb.push(maxEnforced);
        }
        return rgb;
    };

    generateIdenticon = () => {
        // Seed with UUID
        let rng = seedrandom(this.userid)
        let bg_color = this.generateColor(rng); // Generate custom tile color
        let fill_color = [255,255,255] //this.generateColor(rng); // Generate custom tile color
        let canvas = this.setupCanvas(bg_color);
        let context = canvas.getContext('2d');

        // Iterate through squares on left side
        for (let x = 0; x < Math.ceil(this.GRID / 2); x++) {
            for (let y = 0; y < this.GRID; y++) {
                // Randomly fill squares
                if (rng() < this.FILL_CHANCE) {
                    this.fillBlock(x, y, fill_color, context);

                    // Fill right side symmetrically
                    if (x < Math.floor(this.GRID / 2)) {
                        this.fillBlock((this.GRID - 1) - x, y, fill_color, context);
                    }
                }
            }
        }
        return canvas.toDataURL();
    };

    render() {
        return (
            <div className="profile-icon">
                <img src={this.generateIdenticon()}></img>
            </div>
        )
    }
}

export default Identicon;