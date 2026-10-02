import re
import sys

def parse_test_log(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Pattern to detect test header lines
    header_pattern = re.compile(r'^\s*\[\d+/\d+\]\s+\[chromium\]\s+›')
    # Pattern to detect failure indicator lines (starting with spaces and a digit followed by ')')
    fail_pattern = re.compile(r'^\s*\d+\s*\)')
    # Pattern to detect skip indicator
    skip_pattern = re.compile(r'⚠️.*skipping test')

    i = 0
    results = []
    while i < len(lines):
        line = lines[i]
        # Look for test header
        if header_pattern.match(line):
            # Extract test name from header line
            # Format: [x/y] [chromium] › ... › test suite › test name
            parts = line.split(' › ')
            if len(parts) >= 3:
                test_name = ' › '.join(parts[2:]).strip()
            else:
                test_name = line.strip()

            # Initialize status as PASS (will change if we find FAIL or SKIP)
            status = 'PASS'
            # Look ahead for FAIL or SKIP indicators until next header or end
            j = i + 1
            while j < len(lines) and not header_pattern.match(lines[j]):
                if fail_pattern.match(lines[j]):
                    status = 'FAIL'
                    break
                if skip_pattern.search(lines[j]):
                    status = 'SKIP'
                    break
                j += 1

            results.append((test_name, status))
            i = j  # Skip to next header or end
        else:
            i += 1

    return results

if __name__ == '__main__':
    log_file = r'C:\Users\Abu Bakar\.local\share\kilo\tool-output\tool_0fd254227001d8irzztt8e8N9z'
    results = parse_test_log(log_file)
    for test_name, status in results:
        print(f'{test_name}: {status}')