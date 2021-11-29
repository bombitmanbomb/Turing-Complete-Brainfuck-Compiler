#!/usr/bin/env node
import { Command, InvalidArgumentError, } from 'commander'
import { oraPromise } from 'ora'
import chalk from 'chalk';
import fs from 'fs';
import path from 'path/posix';
const program = new Command()
program.version("0.0.1").name('tcbfcomp').description("Pack a brainfuck program into a format for the game Turing Complete")

function myParseInt<T>(value: string, dummyPrevious: T): number {
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) throw new InvalidArgumentError('Not a Number')
  return parsed
}
const TuringByte = {
  ">": 0x00,
  "<": 0x01,
  "+": 0x02,
  "-": 0x03,
  ".": 0x04,
  ",": 0x05,
  "[": 0x06,
  "]": 0x07,
  "EOF": 0x08
}
const WhiteSpace = 0x20
const Newline = `\r\n`
const BrainfuckByte = {
  0x3e: 0x00,
  0x3c: 0x01,
  0x2b: 0x02,
  0x2d: 0x03,
  0x2e: 0x04,
  0x2c: 0x05,
  0x5b: 0x06,
  0x5d: 0x07,
}

class ProgramAddress { }
class BrainfuckCompiled { }
class BrainFuck {
  ProgramMemory: number[] = []
  _packLevel: number = 0
  get PackLevel(): string {
    return `0x${(this._packLevel ?? 1).toString(16).padStart(2,"0")}`
  }
  toString(): string {
    let str = ""
    str += this.PackLevel + Newline

    let SubInstruction = 0
    let Packet = BigInt(0)
    let packets = 0

    for (let byte of this.ProgramMemory) {
      let Bbyte = BigInt(byte)
      Packet += (Bbyte << (BigInt(SubInstruction*4)))
      SubInstruction++
      if (SubInstruction>=16){
        str += Packet.toString().padStart(19,"0")
        packets++
        if (packets%2===0) str+=Newline; else str+= " "
        Packet = BigInt(0)
        SubInstruction = 0
      }
    }
    str+= (Newline + '0x08')
    return str
  }
}


try {
  program
    .argument("<inputFile>")
    .option('-o, --output <outputDir>', 'Output to specicific Location')
    .option('-p, --pack <packLevel>', 'How much to compress the program', myParseInt, 1)
    .action((inputFile: string, options, command) => {
      let succeed!: (value?: unknown) => void
      let fail!: (value?: unknown) => void
      const status = new Promise((s, j) => {
        succeed = s
        fail = j
      })
      const spinner = oraPromise(status, {
        text: "Compiling",
        successText: chalk.green("Compiled!"),
        failText: "Error!"
      })
      let file = fs.readFile(inputFile, (err, data)=>{
        if (err) {
          fail()
          throw chalk.red(err)
        }
        const Prog = new BrainFuck
        Prog._packLevel = options.packLevel
        for (let byte of data){
          let instruction:number|null = BrainfuckByte[ byte as 91];
          if (instruction == null) continue
          Prog.ProgramMemory.push(instruction);
        }
        succeed(true)
        setTimeout(()=>console.log(Prog.toString()), 1000)

      })
    })
    .parse(process.argv)

} catch (error) {

}
