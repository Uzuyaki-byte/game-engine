#include <iostream>
using namespace std;

int stamina;

int main() {
    cout << "What is your stamina good hunter?\n";
    cin >> stamina;
    
    if (stamina < 5) {
        stamina = 5;
    }

    while (stamina > 0) {
        cout << "You are attacking\n";
        stamina--;
        
        if (stamina % 5 == 0) {
            cout << "You fight relentlessly!\n";
        }
    }
    
    if (stamina <= 0) {
        cout << "You collapse. The hunt is over.\n";
    }
}