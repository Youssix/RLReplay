"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
    static readStringEasily(buffer) {
        var stringSize = buffer.nextInt32LE();
        return buffer.nextString(stringSize).replace('\x00', "");
    }
}
exports.Utils = Utils;
//# sourceMappingURL=utils.js.map