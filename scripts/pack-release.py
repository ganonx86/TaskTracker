#!/usr/bin/env python3
"""Zip the publish output, marking *.dll entries with the Windows "hidden" file attribute."""
import os
import stat
import sys
import zipfile

FILE_ATTRIBUTE_HIDDEN = 0x02
FILE_ATTRIBUTE_ARCHIVE = 0x20


def main(source_dir: str, output_zip: str) -> None:
    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _dirs, files in os.walk(source_dir):
            for name in files:
                full_path = os.path.join(root, name)
                arcname = os.path.relpath(full_path, source_dir)
                info = zipfile.ZipInfo.from_file(full_path, arcname)
                info.compress_type = zipfile.ZIP_DEFLATED
                if name.lower().endswith(".dll"):
                    info.create_system = 0  # MS-DOS/Windows, so external_attr is read as DOS attributes.
                    info.external_attr = FILE_ATTRIBUTE_HIDDEN | FILE_ATTRIBUTE_ARCHIVE
                else:
                    info.external_attr = (stat.S_IMODE(os.stat(full_path).st_mode) | stat.S_IFREG) << 16
                with open(full_path, "rb") as f:
                    zf.writestr(info, f.read())


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: pack-release.py <source_dir> <output_zip>", file=sys.stderr)
        raise SystemExit(1)
    main(sys.argv[1], sys.argv[2])
