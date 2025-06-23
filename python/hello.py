import sys, json

def main():
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        data = None
    result = {
        'received': data,
        'message': 'Hello from Python'
    }
    json.dump(result, sys.stdout)

if __name__ == '__main__':
    main()
