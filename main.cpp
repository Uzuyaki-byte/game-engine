#include <iostream>
using namespace std;

int main() {
    int str, agi;

    cout << "What is your strength?\n";
    cin >> str;

    cout << "What is your agility?\n";
    cin >> agi;

    if (str >= 20 && agi >= 20) {
        cout << "You are ready for the hunt.\n";
    } else if (str > 15 && agi > 15) {
        cout << "Good progress good hunter\n";
    } else {
        cout << "Train harder, hunter.\n";
    } if (str > 25 || agi > 25) {
        cout << "A prodigy walks among us.\n";
    } 
    return 0;
}