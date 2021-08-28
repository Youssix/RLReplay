"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const buffer_reader_1 = __importDefault(require("buffer-reader"));
const int64_buffer_1 = __importDefault(require("int64-buffer"));
const utils_1 = require("./utils/utils");
class Header {
    constructor(reader) {
        this.headerSize = reader.nextInt32LE();
        this.headerCRC = reader.nextInt32LE();
        this.headerData = new buffer_reader_1.default(reader.nextBuffer(this.headerSize));
        this.MajorVersion = this.headerData.nextInt32LE();
        this.MinorVersion = this.headerData.nextInt32LE();
        if (this.MajorVersion > 865 && this.MinorVersion > 17)
            this.NetVersion = this.headerData.nextInt32LE();
        var length = this.headerData.nextInt32LE();
        this.GameType = this.headerData.nextString(length).replace('\x00', "");
        this.headerProperties = this.readProperties();
    }
    readProperty() {
        var property_name = utils_1.Utils.readStringEasily(this.headerData);
        if (property_name === 'None') {
            return;
        }
        let type_name = utils_1.Utils.readStringEasily(this.headerData);
        var value;
        switch (type_name) {
            case 'IntProperty': {
                var value_length = this.headerData.nextString(8);
                console.log("value_length" + value_length);
                value = this.headerData.nextInt32LE();
                break;
            }
            case 'NameProperty': {
                var unknown = this.headerData.nextString(8);
                value = utils_1.Utils.readStringEasily(this.headerData);
                break;
            }
            case 'StrProperty': {
                var unknown = this.headerData.nextString(8);
                value = utils_1.Utils.readStringEasily(this.headerData);
                break;
            }
            case 'ByteProperty': {
                var unknown = this.headerData.nextString(8);
                value = {};
                var length = this.headerData.nextInt32LE();
                var valuename = this.headerData.nextString(length);
                var length2 = this.headerData.nextInt32LE();
                value[valuename] = this.headerData.nextString(length2);
                break;
            }
            case 'QWordProperty': {
                var test = this.headerData.nextBuffer(16);
                value = new int64_buffer_1.default.Int64LE(test);
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
                var currentFileSeek = this.headerData.tell();
                var length_in_file = this.headerData.nextString(8);
                var array_length = this.headerData.nextInt32LE();
                value = [];
                for (var i = 0; i < array_length; i++) {
                    value.push(this.readProperties());
                }
                for (var i = 0; i < value.length; i++) {
                    console.log("VALUE ARRAY = " + JSON.stringify(value[i]));
                }
                //console.assert(this.headerData.tell() == currentFileSeek + length_in_file + 8)
                break;
            }
            default: {
                console.log('Unknown type: ', "'" + type_name + "'");
                return;
            }
        }
        console.log(property_name + ' :' + JSON.stringify(value));
        return {
            'name': property_name,
            'value': value,
        };
    }
    readProperties() {
        var results = {};
        while (1) {
            var property = this.readProperty();
            if (property) {
                results[property.name] = property.value;
            }
            else {
                return results;
            }
        }
        return results;
    }
}
exports.Header = Header;
class Level {
    static getLevel(buffer) {
        var level = new Level();
        level.name = utils_1.Utils.readStringEasily(buffer);
        return level;
    }
}
class KeyFrame {
    static getKeyFrame(buffer) {
        var keyFrame = new KeyFrame();
        keyFrame.time = buffer.nextFloatLE();
        keyFrame.frame = buffer.nextInt32LE();
        keyFrame.filePosition = buffer.nextInt32LE();
        return keyFrame;
    }
}
class DebugString {
    static getDebugString(buffer) {
        var debugString = new DebugString();
        debugString.frame = buffer.nextInt32LE();
        debugString.userName = utils_1.Utils.readStringEasily(buffer);
        debugString.text = utils_1.Utils.readStringEasily(buffer);
        return debugString;
    }
}
class TickMark {
    static getTickMark(buffer) {
        var tickMark = new TickMark();
        tickMark.type = utils_1.Utils.readStringEasily(buffer);
        tickMark.frame = buffer.nextInt32LE();
        return tickMark;
    }
}
class ClassIndex {
    static getClassIndex(buffer) {
        var classIndex = new ClassIndex();
        classIndex.class = utils_1.Utils.readStringEasily(buffer);
        classIndex.index = buffer.nextInt32LE();
        return classIndex;
    }
}
class ClassNetCacheProperty {
    static getClassNetCacheProperty(buffer) {
        var prop = new ClassNetCacheProperty();
        prop.index = buffer.nextInt32LE();
        prop.id = buffer.nextInt32LE();
        return prop;
    }
}
class ClassNetCache {
    constructor() {
        this.properties = {};
        this.children = [];
    }
    static getClassNetCache(buffer) {
        var classNetCache = new ClassNetCache();
        classNetCache.objectIndex = buffer.nextInt32LE();
        classNetCache.parentId = buffer.nextInt32LE();
        classNetCache.id = buffer.nextInt32LE();
        classNetCache.propertiesLength = buffer.nextInt32LE();
        for (var i = 0; i < classNetCache.propertiesLength; i++) {
            var prop = ClassNetCacheProperty.getClassNetCacheProperty(buffer);
            classNetCache.properties[prop.id] = prop;
            console.log(JSON.stringify(classNetCache));
        }
        return classNetCache;
    }
}
class Body {
    constructor(reader) {
        this.levels = [];
        this.keyFrames = [];
        this.debugStrings = [];
        this.tickMarks = [];
        this.packages = [];
        this.objects = [];
        this.names = [];
        this.classIndexes = [];
        this.classNetCaches = [];
        this.bodySize = reader.nextInt32LE();
        this.bodyCRC = reader.nextUInt32LE();
        this.bodyData = new buffer_reader_1.default(reader.nextBuffer(this.bodySize));
        var levelLength = this.bodyData.nextInt32LE();
        for (var i = 0; i < levelLength; i++) {
            this.levels.push(Level.getLevel(this.bodyData));
        }
        var keyFrameLength = this.bodyData.nextInt32LE();
        for (var i = 0; i < keyFrameLength; i++) {
            this.keyFrames.push(KeyFrame.getKeyFrame(this.bodyData));
        }
        this.networkStreamLength = this.bodyData.nextInt32LE();
        this.networkStream = this.bodyData.nextBuffer(this.networkStreamLength);
        var debugStringLength = this.bodyData.nextInt32LE();
        for (var i = 0; i < debugStringLength; i++) {
            this.debugStrings.push(DebugString.getDebugString(this.bodyData));
        }
        var tickMarkLength = this.bodyData.nextInt32LE();
        for (var i = 0; i < tickMarkLength; i++) {
            this.tickMarks.push(TickMark.getTickMark(this.bodyData));
        }
        var packagesLength = this.bodyData.nextInt32LE();
        for (var i = 0; i < packagesLength; i++) {
            this.packages.push(utils_1.Utils.readStringEasily(this.bodyData));
        }
        var objectLength = this.bodyData.nextInt32LE();
        for (var i = 0; i < objectLength; i++) {
            this.objects.push(utils_1.Utils.readStringEasily(this.bodyData));
        }
        var namesLength = this.bodyData.nextInt32LE();
        for (var i = 0; i < namesLength; i++) {
            this.names.push(utils_1.Utils.readStringEasily(this.bodyData));
        }
        var classIndexLength = this.bodyData.nextInt32LE();
        for (var i = 0; i < classIndexLength; i++) {
            this.classIndexes.push(ClassIndex.getClassIndex(this.bodyData));
        }
        var classNetCacheLength = this.bodyData.nextInt32LE();
        for (var i = 0; i < classNetCacheLength; i++) {
            this.classNetCaches.push(ClassNetCache.getClassNetCache(this.bodyData));
        }
    }
}
exports.Body = Body;
class Replay {
    constructor(file) {
    }
    readFile(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                fs.readFile(path, function (err, data) {
                    if (err) {
                        reject(err);
                    }
                    resolve(data);
                });
            });
        });
    }
    Setup() {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = yield this.readFile("src/test.replay");
            this.reader = new buffer_reader_1.default(this.data);
            this.header = new Header(this.reader);
            this.body = new Body(this.reader);
        });
    }
    greet() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.Setup();
            console.log(this.header);
            ;
            console.log(this.body);
        });
    }
}
exports.Replay = Replay;
//# sourceMappingURL=Replay.js.map