const {serialize,deserialize}= require('../../parsers/resp-parser')
const {assert}= require('chai')
// What is being tested? -> Redis Serialization protocol, both serialize and deserialize functions!
// Scenarios -> For Serialize: pass array as body, pass string as body, pass error as body, pass body null

describe('serialization',()=>{

    it('should return error message when isError argument is passed as true', () => {
        let data="Error Here",
            originalOutput=serialize(data,false,true),
            expectedOutput=`-ERR ${data}\r\n`

        assert.equal(originalOutput,expectedOutput)
    });

    context("serialize bulk string",()=>{

        it('should return empty bulk string when nothing is passed', () => {
            let data=""
            let expectedOutput="$0\r\n"

            assert.equal(serialize(data),expectedOutput)
        });

        it("should return bulk string when string with no spaces will pass",()=>{
            let data = "Hello"
            let expectedOutput=`$${data.length}\r\n${data}\r\n`

            assert.equal(serialize(data),expectedOutput)
        })

        it("should return bulk string when array of string of length 1 is passed",()=>{
            let data = ["Hello"],
                originalOutput=serialize(data),
                expectedOutput=`$${data[0].length}\r\n${data[0]}\r\n`

            assert.equal(originalOutput,expectedOutput)
        })
    })

    context("serialize integers",()=>{
        it('should return serialize integer when integer value is passed', () => {
            let data=25;
            let expectedOutput=`:${data}\r\n`
            assert.equal(serialize(data),expectedOutput)
        });

        it('should return bulk string when number as a string is passed', () => {
            let data="25",
                originalOutput=serialize(data),
                expectedOutput=`$${data.length}\r\n${data}\r\n`

            assert.equal(originalOutput,expectedOutput,`Expected: ${expectedOutput}, Got: ${originalOutput}`)
        });
    })

    context("serialize arrays and array of arrays",()=>{
        it('should return serialized empty array when 0 length array is passed', () => {
            let data=[],
                originalOutput=serialize(data),
                expectedOutput=`*0\r\n`

            assert.equal(originalOutput,expectedOutput)
        });

        it("should serialized array",()=>{
            let data=["hello","world"],
                originalOutput=serialize(data),
                expectedOutput="*2\r\n$5\r\nhello\r\n$5\r\nworld\r\n"

            assert.equal(originalOutput,expectedOutput,`Expected: ${expectedOutput}, Got: ${originalOutput}`)
        })

        it('should return RESP list when array of arrays is passed', () => {
            let data=[
                [
                    "1526985054069-0",
                    [
                        "temperature",
                        "36",
                        "humidity",
                        "95"
                    ]
                ],
                [
                    "1526985054079-0",
                    [
                        "temperature",
                        "37",
                        "humidity",
                        "94"
                    ]
                ],
            ],
                originalOutput=serialize(data)
            let expectedOutput="*2\r\n" +
                    "*2\r\n" +
                    "$15\r\n1526985054069-0\r\n" +
                    "*4\r\n" +
                    "$11\r\ntemperature\r\n" +
                    "$2\r\n36\r\n" +
                    "$8\r\nhumidity\r\n" +
                    "$2\r\n95\r\n" +
                    "*2\r\n" +
                    "$15\r\n1526985054079-0\r\n" +
                    "*4\r\n" +
                    "$11\r\ntemperature\r\n" +
                    "$2\r\n37\r\n" +
                    "$8\r\nhumidity\r\n" +
                    "$2\r\n94\r\n"

            assert.equal(originalOutput,expectedOutput)
        });

        it("should return serialized empty array when empty array of array is passed",()=>{
            let data=[[],[]],
                originalOutput=serialize(data),
                expectedOutput=`*0\r\n`

            assert.equal(originalOutput,expectedOutput)
        })

        it("should return serialize data as array when returnedArray argument is passed",()=>{
            let data="Help",
                originalOutput=serialize(data,true),
                expectedOutput=`*1\r\n$${data.length}\r\n${data}\r\n`
            assert.equal(originalOutput,expectedOutput)
        })

        it("should return resp list when number is passed inside array",()=>{
            let data=["Help",1,"23"],
                originalOutput=serialize(data),
                expectedOutput='*3\r\n' +
                    `$${data[0].length}\r\n`+
                    `${data[0]}\r\n`+
                    ':1\r\n'+
                    `$${data[2].length}\r\n`+
                    `${data[2]}\r\n`

            assert.equal(originalOutput,expectedOutput)
        })
        it("should return serialized list when Err is passed inside array",()=>{
            let data=["Help","-ERR hello world","23"],
                originalOutput=serialize(data),
                expectedOutput='*3\r\n' +
                    `$${data[0].length}\r\n`+
                    `${data[0]}\r\n`+
                    `${data[1]}\r\n`+
                    `$${data[2].length}\r\n`+
                    `${data[2]}\r\n`

            assert.equal(originalOutput,expectedOutput)
        })
    })
})