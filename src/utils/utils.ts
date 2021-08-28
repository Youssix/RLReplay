import BufferReader from "buffer-reader";

export class Utils
{
    static readStringEasily(buffer: BufferReader)
    {
        var stringSize = buffer.nextInt32LE();
        return buffer.nextString(stringSize).replace('\x00', "");
    }
}