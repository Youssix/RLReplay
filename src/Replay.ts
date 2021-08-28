import * as fs from 'fs';
import BufferReader from "buffer-reader";
import Int64BE from "int64-buffer";
import { Utils } from "./utils/utils";


export class Header
{
    headerData: BufferReader;
    headerSize: any;
    headerCRC: number;
    MajorVersion: number;
    MinorVersion: number;
    NetVersion: number;
    GameType: string;
    headerProperties: {};


    public constructor(reader: BufferReader) {
        
        this.headerSize = reader.nextInt32LE();
        this.headerCRC = reader.nextInt32LE();
        this.headerData = new BufferReader(reader.nextBuffer(this.headerSize));
        this.MajorVersion = this.headerData.nextInt32LE();
        this.MinorVersion = this.headerData.nextInt32LE();
        if (this.MajorVersion > 865 && this.MinorVersion > 17)
          this.NetVersion = this.headerData.nextInt32LE();
        var length = this.headerData.nextInt32LE();
        this.GameType = this.headerData.nextString(length).replace('\x00', "");
        this.headerProperties = this.readProperties();
    }

    readProperty() {
      var property_name = Utils.readStringEasily(this.headerData);
    
      if (property_name === 'None') {
        return
      }
    
      let type_name = Utils.readStringEasily(this.headerData);
      var value;
      switch (type_name) {

        case 'IntProperty': {
          var value_length = this.headerData.nextString(8);
          console.log("value_length" + value_length);
          value = this.headerData.nextInt32LE();
          break;
        }

        case 'NameProperty':{
          var unknown = this.headerData.nextString(8);
          value = Utils.readStringEasily(this.headerData);
          break;
        }

        case 'StrProperty': {
          var unknown = this.headerData.nextString(8);
          value = Utils.readStringEasily(this.headerData);
          break;
        }
        
        case 'ByteProperty': {
          var unknown = this.headerData.nextString(8);
          value = {}
          var length = this.headerData.nextInt32LE();
          var valuename = this.headerData.nextString(length);
          var length2 = this.headerData.nextInt32LE();
          value[valuename] = this.headerData.nextString(length2);
          break
        }

        case 'QWordProperty': {
          var test = this.headerData.nextBuffer(16);
          value = new Int64BE.Int64LE(test);
console.log(value);
          break;
        }

        case 'BoolProperty': {
          var unknown = this.headerData.nextString(8);
          value = Boolean(this.headerData.nextBuffer(1));
console.log(value);
          break;
        }

        case 'FloatProperty': {
          var value_length = this.headerData.nextString(8);
          console.log("value_length" + value_length);
          value = this.headerData.nextFloatLE();
console.log(value);
          break;
        }

        case 'ArrayProperty': {
          var currentFileSeek : number = this.headerData.tell();
    
          var length_in_file = this.headerData.nextString(8);
          var array_length = this.headerData.nextInt32LE();
    
          value = []
    
          for (var i=0; i<array_length; i++) {
            value.push(this.readProperties())
          }


          for (var i = 0; i < value.length; i++)
  {
              console.log("VALUE ARRAY = " + JSON.stringify(value[i]));

          }
          //console.assert(this.headerData.tell() == currentFileSeek + length_in_file + 8)
          break
        }
        default: {
          console.log('Unknown type: ', "'"+type_name+"'")
          return
        }
      }
    console.log(property_name + ' :' + JSON.stringify(value));
      return {
        'name': property_name,
        'value': value,
      }
    }
    
    readProperties() {
      var results = {}
    

      while (1) {
        var property = this.readProperty()
    
        if (property) {
          results[property.name] = property.value;
        } else {
          return results
        }
      }
      return results;
    }
}

class Level {
  name: string;

  static getLevel(buffer : BufferReader)
  {
    var level = new Level();
    level.name = Utils.readStringEasily(buffer);
    return level;
  }
}

class KeyFrame {
  time: number;
  frame: number;
  filePosition: number;

  static getKeyFrame(buffer : BufferReader)
  {
    var keyFrame = new KeyFrame();
    keyFrame.time = buffer.nextFloatLE();
    keyFrame.frame = buffer.nextInt32LE();
    keyFrame.filePosition = buffer.nextInt32LE();
    return keyFrame;
  }
}

class DebugString {
  frame: number;
  userName: string;
  text: string;

  static getDebugString(buffer : BufferReader)
  {
    var debugString = new DebugString();
    debugString.frame = buffer.nextInt32LE();
    debugString.userName = Utils.readStringEasily(buffer);
    debugString.text = Utils.readStringEasily(buffer);
    return debugString;
  }
}

class TickMark {
  type: string;
  frame: number;

  static getTickMark(buffer : BufferReader)
  {
    var tickMark = new TickMark();
    tickMark.type = Utils.readStringEasily(buffer);
    tickMark.frame = buffer.nextInt32LE();
    return tickMark;
  }
}

class ClassIndex {
  class: string;
  index: number;

  static getClassIndex(buffer : BufferReader)
  {
    var classIndex = new ClassIndex();
    classIndex.class = Utils.readStringEasily(buffer);
    classIndex.index = buffer.nextInt32LE();
    return classIndex;
  }
}

class ClassNetCacheProperty
{
  index: number;
  id: number;

    static getClassNetCacheProperty(buffer : BufferReader)
    {
        var prop = new ClassNetCacheProperty();
        prop.index = buffer.nextInt32LE();
        prop.id = buffer.nextInt32LE();
        return prop;
    }
}

class ClassNetCache {
  objectIndex: number;
  parentId: number;
  id: number;
  propertiesLength: number;
  properties: {} = {};
  children: ClassNetCache[] = [];

  static getClassNetCache(buffer : BufferReader)
  {
    var classNetCache = new ClassNetCache();
    classNetCache.objectIndex = buffer.nextInt32LE();
    classNetCache.parentId = buffer.nextInt32LE();
    classNetCache.id = buffer.nextInt32LE();
    classNetCache.propertiesLength = buffer.nextInt32LE();

    for (var i = 0; i < classNetCache.propertiesLength; i++)
    {
      var prop = ClassNetCacheProperty.getClassNetCacheProperty(buffer);
      classNetCache.properties[prop.id] = prop;
      console.log(JSON.stringify(classNetCache));
    }

    return classNetCache;
  }
}

export class Body
{
    bodyData: BufferReader;
    bodySize: number;
    bodyCRC: number;
    levels: Level[] = [];
    keyFrames: KeyFrame[] = [];
    networkStreamLength: number;
    networkStream: Buffer;
    debugStrings: DebugString[] = [];
    tickMarks: TickMark[] = [];
    packages: string[] = [];
    objects: string[] = [];
    names: string[] = [];
    classIndexes: ClassIndex[] = [];
    classNetCaches: ClassNetCache[] = [];

    public constructor(reader: BufferReader) {
      this.bodySize = reader.nextInt32LE();
      this.bodyCRC = reader.nextUInt32LE();
      this.bodyData = new BufferReader(reader.nextBuffer(this.bodySize));

      var levelLength  = this.bodyData.nextInt32LE();
      for (var i = 0; i < levelLength; i++){
        this.levels.push(Level.getLevel(this.bodyData));
      }

      var keyFrameLength  = this.bodyData.nextInt32LE();
      for (var i = 0; i < keyFrameLength; i++){
        this.keyFrames.push(KeyFrame.getKeyFrame(this.bodyData));
      }

      this.networkStreamLength = this.bodyData.nextInt32LE();
      this.networkStream = this.bodyData.nextBuffer(this.networkStreamLength);

      var debugStringLength  = this.bodyData.nextInt32LE();
      for (var i = 0; i <  debugStringLength; i++){
        this.debugStrings.push(DebugString.getDebugString(this.bodyData));
      }

      var tickMarkLength  = this.bodyData.nextInt32LE();
      for (var i = 0; i <  tickMarkLength; i++){
        this.tickMarks.push(TickMark.getTickMark(this.bodyData));
      }

      var packagesLength  = this.bodyData.nextInt32LE();
      for (var i = 0; i <  packagesLength; i++){
        this.packages.push(Utils.readStringEasily(this.bodyData));
      }

      var objectLength  = this.bodyData.nextInt32LE();
      for (var i = 0; i <  objectLength; i++){
        this.objects.push(Utils.readStringEasily(this.bodyData));
      }

      var namesLength  = this.bodyData.nextInt32LE();
      for (var i = 0; i <  namesLength; i++){
        this.names.push(Utils.readStringEasily(this.bodyData));
      }

      var classIndexLength  = this.bodyData.nextInt32LE();
      for (var i = 0; i <  classIndexLength; i++){
        this.classIndexes.push(ClassIndex.getClassIndex(this.bodyData));
      }

      var classNetCacheLength  = this.bodyData.nextInt32LE();
      for (var i = 0; i <  classNetCacheLength; i++){
        this.classNetCaches.push(ClassNetCache.getClassNetCache(this.bodyData));
      }

    }
}




export class Replay {
    data: any;
    reader: BufferReader;
    header: Header;
    body: Body;

    public constructor(file: string) {
    }

    async readFile(path) {
      return new Promise((resolve, reject) => {
        fs.readFile(path, function (err, data) {
          if (err) {
            reject(err);
          }
          resolve(data) as any;
        });
      });
  }
    async Setup() {
      this.data = await this.readFile("src/test.replay");
      this.reader = new BufferReader(this.data);
      this.header = new Header(this.reader);
      this.body = new Body(this.reader);
    }
    
    async greet()
    {
        await this.Setup();
        console.log(this.header);;
        console.log(this.body);
    }

  }
