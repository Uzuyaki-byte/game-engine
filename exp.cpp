#include <iostream>
using namespace std; 

int stamina = 10;

int main() {  
    while (stamina > -1) {
        cout << "You attack! Remaining stamina: " << stamina << endl;
        stamina--;
    }

    if (stamina == -1) {
        cout << "You are exhausted.\n";
    }
    
    return 0;
}
