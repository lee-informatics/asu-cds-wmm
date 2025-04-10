// Author: Preston Lee

import path from 'path';
import fs from 'fs';

export class CliVersion {
    public static VERSION: string = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString()).version;
}