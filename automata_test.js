import { assert, assertEquals } from "@std/assert";
import { LambdaTranspiler } from "./main.js";

function loadPreset(number) {
    const source = Deno.readTextFileSync(
        new URL(`./website/presets/rule${number}.lc`, import.meta.url),
    );
    const code = new LambdaTranspiler({ coloredText: false }).transpile(source);
    const output = [];
    const lc = new Function(
        "console",
        `"use strict";\n${code}\nreturn { Rule, Step, True, False, Cons, Nil, Head, Tail, IsNil };`,
    )({ log: (value) => output.push(value) });
    return { lc, output };
}

// Independent reference: Wolfram rule numbers encode all eight neighborhoods
// as bits, with 000 in the least significant position and 111 in the highest.
function referenceStep(number, row) {
    return row.map((center, i) => {
        const left = row[i - 1] ?? 0;
        const right = row[i + 1] ?? 0;
        return (number >> ((left << 2) | (center << 1) | right)) & 1;
    });
}

function encode(lc, row) {
    return row.reduceRight(
        (tail, bit) => lc.Cons(bit ? lc.True : lc.False)(tail),
        lc.Nil,
    );
}

function decode(lc, row) {
    const result = [];
    while (!lc.IsNil(row)(true)(false)) {
        assert(result.length < 128, "unexpectedly long or cyclic row");
        result.push(lc.Head(row)(true)(false) ? 1 : 0);
        row = lc.Tail(row);
    }
    return result;
}

for (const number of [30, 110]) {
    Deno.test(`Rule ${number} LC expression matches all eight neighborhoods`, () => {
        const { lc } = loadPreset(number);
        const booleans = [lc.False, lc.True];
        for (let neighborhood = 0; neighborhood < 8; neighborhood++) {
            const left = booleans[(neighborhood >> 2) & 1];
            const center = booleans[(neighborhood >> 1) & 1];
            const right = booleans[neighborhood & 1];
            const actual = lc.Rule(left)(center)(right)(true)(false) ? 1 : 0;
            assertEquals(actual, (number >> neighborhood) & 1);
        }
    });

    Deno.test(`Rule ${number} preset prints the initial row and 16 correct generations`, () => {
        const { output } = loadPreset(number);
        const rows = output.filter(Array.isArray);
        assertEquals(rows.length, 17);
        let expected = Array.from({ length: 33 }, (_, i) => i === 16 ? 1 : 0);
        for (let generation = 0; generation < rows.length; generation++) {
            assertEquals(
                rows[generation],
                expected,
                `generation ${generation}`,
            );
            expected = referenceStep(number, expected);
        }
    });

    Deno.test(`Rule ${number} updates arbitrary rows simultaneously with zero boundaries`, () => {
        const { lc } = loadPreset(number);
        const seeds = [
            [],
            [0],
            [1],
            [1, 0],
            [0, 1],
            [1, 0, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 1, 1, 0, 1],
        ];
        for (const seed of seeds) {
            const original = encode(lc, seed);
            let row = original;
            let expected = seed;
            for (let generation = 1; generation <= 4; generation++) {
                row = lc.Step(row);
                expected = referenceStep(number, expected);
                assertEquals(decode(lc, row), expected);
            }
            assertEquals(
                decode(lc, original),
                seed,
                "the input row is preserved",
            );
        }
    });
}
