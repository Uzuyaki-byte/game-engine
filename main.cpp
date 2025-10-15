#include <iostream>
using namespace std;

int main() {
    int num1;
    int num2;

    cout << "What is your first number?\n";
    cin >> num1;

    cout << "What is your second number?\n";
    cin >> num2;

    cout << "Sum = " << num1 + num2 << endl;
    cout << "Difference = " << num1 - num2 << endl;
    cout << "Product = " << num1 * num2 << endl;
    cout << "Quotient = " << num1 / num2 << endl;
    return 0;
}